package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser_Id(Long userId);
    
    boolean existsByUser_Id(Long userId);
}