package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.doctor.CreateDoctorRequest;
import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorProfileRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorStatusRequest;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.SpecialtyRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.DoctorService;
import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SpecialtyRepository specialtyRepository;

    // --- API CỦA BẠN (Cập nhật hồ sơ cá nhân) ---
    @Override
    @Transactional
    @CacheEvict(value = {"doctors", "doctor"}, allEntries = true)
    public DoctorResponse updateMyProfile(UpdateDoctorProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!"DOCTOR".equalsIgnoreCase(user.getRole().getName())) {
            throw new IllegalArgumentException("Only doctors can update doctor profile");
        }

        Doctor doctor = doctorRepository.findByUser_Id(user.getId())
                .orElseGet(() -> {
                    Doctor newDoctor = new Doctor();
                    newDoctor.setUser(user);
                    newDoctor.setAverageRating(BigDecimal.ZERO);
                    newDoctor.setStatus("ACTIVE");
                    return newDoctor;
                });

        if (request.specialtyId() != null) {
            Specialty specialty = specialtyRepository.findById(request.specialtyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Specialty not found"));
            doctor.setSpecialty(specialty);
        }

        if (request.experienceYears() != null) doctor.setExperienceYears(request.experienceYears());
        if (request.qualification() != null) doctor.setQualification(request.qualification());
        if (request.biography() != null) doctor.setBiography(request.biography());
        if (request.clinicRoom() != null) doctor.setClinicRoom(request.clinicRoom());
        if (request.averageRating() != null) doctor.setAverageRating(BigDecimal.valueOf(request.averageRating()));
        if (request.status() != null) doctor.setStatus(request.status());

        doctor = doctorRepository.save(doctor);
        return toResponse(doctor);
    }

    // --- API CỦA NHÓM (Dành cho Admin) ---
    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "doctors",
            key = "T(String).valueOf(#specialtyId) + ':' + (#keyword == null ? '' : #keyword.trim().toLowerCase())"
    )
    public List<DoctorResponse> getAllDoctors(Long specialtyId, String keyword) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();

        List<Doctor> doctors;
        if (specialtyId != null && normalizedKeyword != null && !normalizedKeyword.isBlank()) {
            doctors = doctorRepository.findBySpecialty_IdAndUser_FullNameContainingIgnoreCase(specialtyId, normalizedKeyword);
        } else if (specialtyId != null) {
            doctors = doctorRepository.findBySpecialty_Id(specialtyId);
        } else if (normalizedKeyword != null && !normalizedKeyword.isBlank()) {
            doctors = doctorRepository.findByUser_FullNameContainingIgnoreCase(normalizedKeyword);
        } else {
            doctors = doctorRepository.findAll();
        }

        return doctors.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Cacheable(value = "doctor", key = "#id")
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return toResponse(doctor);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"doctors", "doctor"}, allEntries = true)
    public DoctorResponse createDoctor(CreateDoctorRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.userId()));

        String roleName = user.getRole().getName().trim().toUpperCase();

        if (doctorRepository.existsByUser_Id(request.userId())) {
            throw new IllegalArgumentException("Doctor profile already exists for user id: " + request.userId());
        }

        if ("ADMIN".equals(roleName)) {
            throw new IllegalArgumentException("Admin account cannot be converted to doctor");
        }

        if (!"DOCTOR".equals(roleName)) {
            Role doctorRole = roleRepository.findByName("DOCTOR")
                    .orElseThrow(() -> new IllegalStateException("Role DOCTOR was not found"));
            user.setRole(doctorRole);
            user = userRepository.save(user);
        }

        Specialty specialty = specialtyRepository.findById(request.specialtyId())
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found with id: " + request.specialtyId()));

        Doctor doctor = doctorRepository.save(
                Doctor.builder()
                        .user(user)
                        .specialty(specialty)
                        .experienceYears(request.experienceYears())
                        .qualification(request.qualification())
                        .biography(request.biography())
                        .clinicRoom(request.clinicRoom())
                        .averageRating(BigDecimal.ZERO.setScale(2))
                        .consultationFee(request.consultationFee())
                        .status("ACTIVE")
                        .build()
        );

        return toResponse(doctor);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"doctors", "doctor"}, allEntries = true)
    public DoctorResponse updateDoctor(Long id, UpdateDoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        if (request.specialtyId() != null) {
            Specialty specialty = specialtyRepository.findById(request.specialtyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Specialty not found with id: " + request.specialtyId()));
            doctor.setSpecialty(specialty);
        }

        if (request.experienceYears() != null) {
            doctor.setExperienceYears(request.experienceYears());
        }

        if (request.qualification() != null && !request.qualification().isBlank()) {
            doctor.setQualification(request.qualification());
        }

        if (request.biography() != null && !request.biography().isBlank()) {
            doctor.setBiography(request.biography());
        }

        if (request.clinicRoom() != null && !request.clinicRoom().isBlank()) {
            doctor.setClinicRoom(request.clinicRoom());
        }

        if (request.consultationFee() != null) {
            doctor.setConsultationFee(request.consultationFee());
        }

        return toResponse(doctorRepository.save(doctor));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"doctors", "doctor"}, allEntries = true)
    public DoctorResponse updateDoctorStatus(Long id, UpdateDoctorStatusRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        doctor.setStatus(request.status().trim().toUpperCase());
        return toResponse(doctorRepository.save(doctor));
    }

    private DoctorResponse toResponse(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getUser().getId(),
                doctor.getUser().getFullName(),
                doctor.getUser().getEmail(),
                doctor.getUser().getPhone(),
                doctor.getUser().getAvatarUrl(),
                doctor.getSpecialty() != null ? doctor.getSpecialty().getId() : null,
                doctor.getSpecialty() != null ? doctor.getSpecialty().getName() : null,
                doctor.getExperienceYears(),
                doctor.getQualification(),
                doctor.getBiography(),
                doctor.getClinicRoom(),
                doctor.getAverageRating(),
                doctor.getConsultationFee(),
                doctor.getStatus(),
                doctor.getCreatedAt(),
                doctor.getUpdatedAt()
        );
    }
}
