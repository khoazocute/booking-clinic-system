package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.medical_record.CreateMedicalRecordRequest;
import com.example.booking_clinic.dto.medical_record.MedicalRecordResponse;
import com.example.booking_clinic.dto.medical_record.UpdateMedicalRecordRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.MedicalRecord;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.MedicalRecordRepository;
import com.example.booking_clinic.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    public MedicalRecordResponse createMedicalRecord(CreateMedicalRecordRequest request) {
        User currentUser = getCurrentUser();

        Doctor doctor = doctorRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("You are not the doctor of this appointment");
        }

        if (!"CONFIRMED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException(
                    "Appointment must be CONFIRMED to create a medical record. Current status: " + appointment.getStatus());
        }

        if (medicalRecordRepository.existsByAppointment_Id(appointment.getId())) {
            throw new IllegalArgumentException("A medical record already exists for this appointment");
        }

        MedicalRecord record = MedicalRecord.builder()
                .appointment(appointment)
                .doctor(doctor)
                .patient(appointment.getPatient())
                .symptoms(request.symptoms())
                .diagnosis(request.diagnosis())
                .treatmentPlan(request.treatmentPlan())
                .notes(request.notes())
                .followUpDate(request.followUpDate())
                .build();

        appointment.setStatus("COMPLETED");
        appointmentRepository.save(appointment);

        return toResponse(medicalRecordRepository.save(record));
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponse getMedicalRecordById(Long id) {
        User currentUser = getCurrentUser();
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        checkAccessPermission(currentUser, record);
        return toResponse(record);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordResponse getMedicalRecordByAppointmentId(Long appointmentId) {
        User currentUser = getCurrentUser();
        MedicalRecord record = medicalRecordRepository.findByAppointment_Id(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found for this appointment"));

        checkAccessPermission(currentUser, record);
        return toResponse(record);
    }

    @Override
    @Transactional
    public MedicalRecordResponse updateMedicalRecord(Long id, UpdateMedicalRecordRequest request) {
        User currentUser = getCurrentUser();
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        Doctor doctor = doctorRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        if (!record.getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("You are not allowed to update this medical record");
        }

        if (request.symptoms() != null && !request.symptoms().isBlank()) {
            record.setSymptoms(request.symptoms());
        }
        if (request.diagnosis() != null && !request.diagnosis().isBlank()) {
            record.setDiagnosis(request.diagnosis());
        }
        if (request.treatmentPlan() != null && !request.treatmentPlan().isBlank()) {
            record.setTreatmentPlan(request.treatmentPlan());
        }
        if (request.notes() != null) {
            record.setNotes(request.notes());
        }
        if (request.followUpDate() != null) {
            record.setFollowUpDate(request.followUpDate());
        }

        return toResponse(medicalRecordRepository.save(record));
    }

    private void checkAccessPermission(User currentUser, MedicalRecord record) {
        String role = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");

        if ("ADMIN".equals(role)) return;

        if ("DOCTOR".equals(role)) {
            Long doctorUserId = record.getDoctor().getUser().getId();
            if (!doctorUserId.equals(currentUser.getId())) {
                throw new IllegalArgumentException("You are not allowed to view this medical record");
            }
            return;
        }

        if ("PATIENT".equals(role)) {
            Long patientUserId = record.getPatient().getUser().getId();
            if (!patientUserId.equals(currentUser.getId())) {
                throw new IllegalArgumentException("You are not allowed to view this medical record");
            }
            return;
        }

        throw new IllegalArgumentException("Access denied");
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }

    private MedicalRecordResponse toResponse(MedicalRecord record) {
        return new MedicalRecordResponse(
                record.getId(),
                record.getAppointment().getId(),
                record.getDoctor().getId(),
                record.getDoctor().getUser().getFullName(),
                record.getPatient().getId(),
                record.getPatient().getUser().getFullName(),
                record.getSymptoms(),
                record.getDiagnosis(),
                record.getTreatmentPlan(),
                record.getNotes(),
                record.getFollowUpDate(),
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }
}
