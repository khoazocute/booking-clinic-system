package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.patient.PatientResponse;
import com.example.booking_clinic.dto.patient.UpdatePatientRequest;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.PatientRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PatientResponse getMyProfile() {
        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return toResponse(patient);
    }

    @Override
    @Transactional
    public PatientResponse updateMyProfile(UpdatePatientRequest request) {
        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findByUser_Id(currentUser.getId())
                .orElse(Patient.builder()
                        .user(currentUser)
                        .build());

        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setAddress(request.address());
        patient.setBloodType(request.bloodType());
        patient.setIdentityNumber(request.identityNumber());
        patient.setInsuranceNumber(request.insuranceNumber());
        patient.setEmergencyContactPhone(request.emergencyContactPhone());
        patient.setMedicalHistoryNote(request.medicalHistoryNote());

        return toResponse(patientRepository.save(patient));
    }

     private User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    User principal = (User) authentication.getPrincipal();

    return userRepository.findByEmail(principal.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
}

     private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getUser().getId(),
                patient.getUser().getFullName(),
                patient.getUser().getEmail(),
                patient.getUser().getPhone(),
                patient.getUser().getAvatarUrl(),
                patient.getDateOfBirth(),
                patient.getGender(),
                patient.getAddress(),
                patient.getBloodType(),
                patient.getIdentityNumber(),
                patient.getInsuranceNumber(),
                patient.getEmergencyContactPhone(),
                patient.getMedicalHistoryNote()
        );
    }
}
