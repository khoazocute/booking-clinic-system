package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorProfileRequest;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public DoctorResponse updateMyProfile(UpdateDoctorProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!"DOCTOR".equalsIgnoreCase(user.getRole().getName())) {
            throw new IllegalArgumentException("Only doctors can update doctor profile");
        }

        Doctor doctor = doctorRepository.findById(user.getId())
                .orElseGet(() -> {
                    Doctor newDoctor = new Doctor();
                    newDoctor.setUser(user);
                    return newDoctor;
                });

        if (request.specialtyId() != null) doctor.setSpecialtyId(request.specialtyId());
        if (request.experienceYears() != null) doctor.setExperienceYears(request.experienceYears());
        if (request.qualification() != null) doctor.setQualification(request.qualification());
        if (request.biography() != null) doctor.setBiography(request.biography());
        if (request.clinicRoom() != null) doctor.setClinicRoom(request.clinicRoom());
        if (request.averageRating() != null) doctor.setAverageRating(request.averageRating());
        if (request.status() != null) doctor.setStatus(request.status());

        doctor = doctorRepository.save(doctor);

        return new DoctorResponse(
                doctor.getUser().getId(),
                doctor.getUser().getId(),
                doctor.getSpecialtyId(),
                doctor.getExperienceYears(),
                doctor.getQualification(),
                doctor.getBiography(),
                doctor.getClinicRoom(),
                doctor.getAverageRating(),
                doctor.getStatus()
        );
    }
}
