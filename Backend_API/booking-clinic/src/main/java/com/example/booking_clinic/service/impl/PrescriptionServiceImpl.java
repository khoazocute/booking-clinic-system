package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.common.exception.InvalidAppointmentStateException;
import com.example.booking_clinic.common.exception.PrescriptionAlreadyExistsException;
import com.example.booking_clinic.common.exception.MedicineInactiveException;
import com.example.booking_clinic.dto.prescription.CreatePrescriptionItemRequest;
import com.example.booking_clinic.dto.prescription.CreatePrescriptionRequest;
import com.example.booking_clinic.dto.prescription.PrescriptionItemResponse;
import com.example.booking_clinic.dto.prescription.PrescriptionResponse;
import com.example.booking_clinic.entity.*;
import com.example.booking_clinic.repository.*;
import com.example.booking_clinic.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;

    @Override
    @Transactional
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest request) {
        // 1. Resolve current doctor from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        Doctor doctor = doctorRepository.findByUser_Id(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user id: " + principal.getId()));

        // 2. Validate medical record & appointment
        MedicalRecord medicalRecord = medicalRecordRepository.findById(request.medicalRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + request.medicalRecordId()));

        Appointment appointment = medicalRecord.getAppointment();
        if (appointment == null) {
            throw new InvalidAppointmentStateException("Appointment missing for medical record");
        }

        // Doctor must own this case
        if (!doctor.getId().equals(appointment.getDoctor().getId())) {
            throw new IllegalArgumentException("Doctor does not own this appointment case");
        }

        // Appointment status must not be null and must be COMPLETED
        if (appointment.getStatus() == null) {
            throw new InvalidAppointmentStateException("Appointment status is null, cannot create prescription");
        }
        
        if (!appointment.getStatus().equals(com.example.booking_clinic.entity.enums.AppointmentStatus.COMPLETED)) {
            throw new InvalidAppointmentStateException("Appointment must be in COMPLETED state to create a prescription. Current status: " + appointment.getStatus());
        }

        // One prescription per medical record
        if (prescriptionRepository.existsByMedicalRecordId(medicalRecord.getId())) {
            throw new PrescriptionAlreadyExistsException("Prescription already exists for this medical record");
        }

        // Prevent duplicate medicines in the same request
        long uniqueMedicineCount = request.items().stream()
                .map(CreatePrescriptionItemRequest::medicineId)
                .distinct()
                .count();
        if (uniqueMedicineCount < request.items().size()) {
            throw new IllegalArgumentException("Duplicate medicines are not allowed in the same prescription");
        }

        // 3. Process medicines batch validation
        List<Long> medicineIds = request.items().stream()
                .map(CreatePrescriptionItemRequest::medicineId)
                .toList();

        Map<Long, Medicine> medicineMap = medicineRepository.findByIdIn(medicineIds).stream()
                .collect(Collectors.toMap(Medicine::getId, m -> m));

        for (Long medId : medicineIds) {
            if (!medicineMap.containsKey(medId)) {
                throw new ResourceNotFoundException("Medicine not found with id: " + medId);
            }
            Medicine m = medicineMap.get(medId);
            if (!m.getStatus().equals(com.example.booking_clinic.entity.enums.MedicineStatus.ACTIVE)) {
                throw new MedicineInactiveException("Medicine is not active: " + m.getName());
            }
        }

        // 4. Create Prescription and Items
        Prescription prescription = new Prescription();
        prescription.setMedicalRecord(medicalRecord);
        prescription.setGeneralNote(request.generalNote());
        prescription.setDoctor(doctor);
        prescription.setPatient(appointment.getPatient());

        List<PrescriptionItem> items = request.items().stream().map(reqItem -> {
            PrescriptionItem item = new PrescriptionItem();
            item.setPrescription(prescription);
            item.setMedicine(medicineMap.get(reqItem.medicineId()));
            item.setDosePerTime(reqItem.dosePerTime());
            item.setTimesPerDay(reqItem.timesPerDay());
            item.setDurationDays(reqItem.durationDays());
            
            // Required: Quantity should be calculated in backend
            int quantity = reqItem.dosePerTime() * reqItem.timesPerDay() * reqItem.durationDays();
            item.setQuantity(quantity);

            item.setDosageText(reqItem.dosageText());
            item.setInstruction(reqItem.instruction());
            item.setNote(reqItem.note());
            return item;
        }).toList();

        prescription.getItems().addAll(items);
        
        Prescription savedPrescription = prescriptionRepository.save(prescription);

        return toResponse(savedPrescription);
    }

    private PrescriptionResponse toResponse(Prescription prescription) {
        List<PrescriptionItemResponse> itemResponses = prescription.getItems().stream()
                .map(item -> new PrescriptionItemResponse(
                        item.getId(),
                        item.getMedicine().getId(),
                        item.getMedicine().getName(),
                        item.getDosePerTime(),
                        item.getTimesPerDay(),
                        item.getDurationDays(),
                        item.getQuantity(),
                        item.getDosageText(),
                        item.getInstruction(),
                        item.getNote()
                ))
                .toList();

        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getMedicalRecord().getId(),
                prescription.getGeneralNote(),
                prescription.getCreatedAt(),
                itemResponses
        );
    }
}
