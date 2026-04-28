package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    boolean existsByMedicalRecordId(Long medicalRecordId);
}
