package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByUser_Id(Long userId);

    List<Doctor> findBySpecialty_Id(Long specialtyId);

    List<Doctor> findByUser_FullNameContainingIgnoreCase(String keyword);

    List<Doctor> findBySpecialty_IdAndUser_FullNameContainingIgnoreCase(Long specialtyId, String keyword);
}
