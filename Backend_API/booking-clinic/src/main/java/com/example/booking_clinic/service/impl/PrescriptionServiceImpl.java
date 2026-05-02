package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.common.exception.InvalidAppointmentStateException;
import com.example.booking_clinic.common.exception.PrescriptionAlreadyExistsException;
import com.example.booking_clinic.common.exception.MedicineInactiveException;
import com.example.booking_clinic.dto.prescription.CreatePrescriptionItemRequest;
import com.example.booking_clinic.dto.prescription.CreatePrescriptionRequest;
import com.example.booking_clinic.dto.prescription.PrescriptionDetailResponse;
import com.example.booking_clinic.dto.prescription.PrescriptionItemDto;
import com.example.booking_clinic.dto.prescription.PrescriptionItemResponse;
import com.example.booking_clinic.dto.prescription.PrescriptionResponse;
import com.example.booking_clinic.dto.prescription.UpdatePrescriptionRequest;
import com.example.booking_clinic.entity.*;
import com.example.booking_clinic.entity.enums.MedicineStatus;
import com.example.booking_clinic.repository.*;
import com.example.booking_clinic.service.NotificationService;
import com.example.booking_clinic.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final MedicineRepository medicineRepository;
    private final NotificationService notificationService;

    // ==================== CREATE ====================

    @Override
    @Transactional
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest request) {
        // 1. Resolve current doctor from security context
        User principal = resolveCurrentUser();

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
        if (doctor.getId().longValue() != appointment.getDoctor().getId().longValue()) {
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
            if (!m.getStatus().equals(MedicineStatus.ACTIVE)) {
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
            Medicine medicine = medicineMap.get(reqItem.medicineId());
            item.setMedicine(medicine);
            item.setDosePerTime(reqItem.dosePerTime());
            item.setTimesPerDay(reqItem.timesPerDay());
            item.setDurationDays(reqItem.durationDays());
            
            // Auto-calculate quantity
            int quantity = reqItem.dosePerTime() * reqItem.timesPerDay() * reqItem.durationDays();
            item.setQuantity(quantity);

            // Snapshot price from Medicine at time of prescription
            BigDecimal unitPrice = medicine.getUnitPrice() != null ? medicine.getUnitPrice() : BigDecimal.ZERO;
            item.setUnitPrice(unitPrice);
            item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)));

            item.setDosageText(reqItem.dosageText());
            item.setInstruction(reqItem.instruction());
            item.setNote(reqItem.note());
            return item;
        }).toList();

        prescription.getItems().addAll(items);
        
        Prescription savedPrescription = prescriptionRepository.save(prescription);

        notificationService.createNotification(
                appointment.getPatient().getUser(),
                "Don thuoc da duoc tao",
                "Bac si da tao don thuoc cho lich kham cua ban",
                "PRESCRIPTION_CREATED",
                "PRESCRIPTION",
                savedPrescription.getId()
        );

        return toResponse(savedPrescription);
    }

    // ==================== GET BY ID ====================

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDetailResponse getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        checkReadPermission(prescription);

        return toDetailResponse(prescription);
    }

    // ==================== GET BY MEDICAL RECORD ID ====================

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDetailResponse getPrescriptionByMedicalRecordId(Long medicalRecordId) {
        // Validate medical record exists first
        if (!medicalRecordRepository.existsById(medicalRecordId)) {
            throw new ResourceNotFoundException("Medical record not found with id: " + medicalRecordId);
        }

        Prescription prescription = prescriptionRepository.findByMedicalRecordId(medicalRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for medical record id: " + medicalRecordId));

        checkReadPermission(prescription);

        return toDetailResponse(prescription);
    }

    // ==================== UPDATE (PATCH) ====================

    @Override
    @Transactional
    public PrescriptionDetailResponse updatePrescription(Long id, UpdatePrescriptionRequest request) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        // Only the authoring doctor can update
        checkDoctorOwnership(prescription);

        // Update generalNote if provided
        if (request.generalNote() != null) {
            prescription.setGeneralNote(request.generalNote());
        }

        // Update items if provided
        if (request.items() != null) {
            // Validate: check for duplicate medicineId in the request
            long uniqueMedicineCount = request.items().stream()
                    .map(PrescriptionItemDto::medicineId)
                    .distinct()
                    .count();
            if (uniqueMedicineCount < request.items().size()) {
                throw new IllegalArgumentException("Duplicate medicines are not allowed");
            }

            // Validate all medicines exist and are ACTIVE
            List<Long> medicineIds = request.items().stream()
                    .map(PrescriptionItemDto::medicineId)
                    .toList();

            Map<Long, Medicine> medicineMap = medicineRepository.findByIdIn(medicineIds).stream()
                    .collect(Collectors.toMap(Medicine::getId, m -> m));

            for (Long medId : medicineIds) {
                if (!medicineMap.containsKey(medId)) {
                    throw new ResourceNotFoundException("Medicine not found with id: " + medId);
                }
                Medicine m = medicineMap.get(medId);
                if (!m.getStatus().equals(MedicineStatus.ACTIVE)) {
                    throw new MedicineInactiveException("Medicine is not active: " + m.getName());
                }
            }

            // Clear old items (orphanRemoval = true will delete them from DB)
            prescription.getItems().clear();

            // Build and add new items
            List<PrescriptionItem> newItems = request.items().stream().map(dto -> {
                PrescriptionItem item = new PrescriptionItem();
                item.setPrescription(prescription);
                Medicine medicine = medicineMap.get(dto.medicineId());
                item.setMedicine(medicine);
                item.setDosePerTime(dto.dosePerTime());
                item.setTimesPerDay(dto.timesPerDay());
                item.setDurationDays(dto.durationDays());

                // Auto-calculate quantity — never trust client value
                int quantity = dto.dosePerTime() * dto.timesPerDay() * dto.durationDays();
                item.setQuantity(quantity);

                // Snapshot price from Medicine at time of update
                BigDecimal unitPrice = medicine.getUnitPrice() != null ? medicine.getUnitPrice() : BigDecimal.ZERO;
                item.setUnitPrice(unitPrice);
                item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)));

                item.setDosageText(dto.dosageText());
                item.setInstruction(dto.instruction());
                item.setNote(dto.note());
                return item;
            }).toList();

            prescription.getItems().addAll(newItems);
        }

        Prescription saved = prescriptionRepository.save(prescription);
        return toDetailResponse(saved);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Extracts the current authenticated User from SecurityContext.
     */
    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (User) authentication.getPrincipal();
    }

    /**
     * Authorization check for GET endpoints.
     * - ADMIN: full access (bypass)
     * - DOCTOR: only prescriptions they authored
     * - PATIENT: only their own prescriptions
     */
    private void checkReadPermission(Prescription prescription) {
        // Lấy Authentication từ Security Context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = resolveCurrentUser();
        
        // Lấy thẳng danh sách quyền từ Authentication (đã được load sẵn, không bị Lazy Error)
        String authorities = authentication.getAuthorities().toString().toUpperCase();

        if (authorities.contains("ADMIN")) {
            return; // Admin can view everything
        }

        if (authorities.contains("DOCTOR")) {
            Doctor doctor = doctorRepository.findByUser_Id(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            if (!doctor.getId().equals(prescription.getDoctor().getId())) {
                throw new AccessDeniedException("You do not have permission to view this prescription");
            }
            return;
        }

        if (authorities.contains("PATIENT")) {
            Patient patient = patientRepository.findByUser_Id(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
            if (!patient.getId().equals(prescription.getPatient().getId())) {
                throw new AccessDeniedException("You do not have permission to view this prescription");
            }
            return;
        }

        throw new AccessDeniedException("You do not have permission to view this prescription");
    }
    /**
     * Authorization check for PATCH endpoint.
     * Only the doctor who authored the prescription can update it.
     */
    private void checkDoctorOwnership(Prescription prescription) {
        User principal = resolveCurrentUser();

        Doctor doctor = doctorRepository.findByUser_Id(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user id: " + principal.getId()));

        if (doctor.getId().longValue() != prescription.getDoctor().getId().longValue()) {
            throw new AccessDeniedException("You are not the author of this prescription");
        }
    }

    /**
     * Maps Prescription entity to the basic PrescriptionResponse (used for POST create).
     */
    private PrescriptionResponse toResponse(Prescription prescription) {
        List<PrescriptionItemResponse> itemResponses = prescription.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getMedicalRecord().getId(),
                prescription.getGeneralNote(),
                prescription.getCreatedAt(),
                itemResponses
        );
    }

    /**
     * Maps Prescription entity to the rich PrescriptionDetailResponse (used for GET/PATCH).
     */
    private PrescriptionDetailResponse toDetailResponse(Prescription prescription) {
        List<PrescriptionItemResponse> itemResponses = prescription.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        // Calculate total medicine fee = sum of all item lineTotals
        BigDecimal totalMedicineFee = prescription.getItems().stream()
                .map(item -> item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PrescriptionDetailResponse(
                prescription.getId(),
                prescription.getMedicalRecord().getId(),
                prescription.getDoctor().getId(),
                prescription.getDoctor().getUser().getFullName(),
                prescription.getPatient().getId(),
                prescription.getPatient().getUser().getFullName(),
                prescription.getGeneralNote(),
                prescription.getStatus(),
                totalMedicineFee,
                prescription.getCreatedAt(),
                prescription.getUpdatedAt(),
                itemResponses
        );
    }

    /**
     * Maps a single PrescriptionItem entity to PrescriptionItemResponse.
     */
    private PrescriptionItemResponse toItemResponse(PrescriptionItem item) {
        return new PrescriptionItemResponse(
                item.getId(),
                item.getMedicine().getId(),
                item.getMedicine().getName(),
                item.getDosePerTime(),
                item.getTimesPerDay(),
                item.getDurationDays(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal(),
                item.getDosageText(),
                item.getInstruction(),
                item.getNote()
        );
    }
}

