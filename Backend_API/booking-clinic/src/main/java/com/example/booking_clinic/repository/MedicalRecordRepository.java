package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Optional<MedicalRecord> findByAppointment_Id(Long appointmentId);

    boolean existsByAppointment_Id(Long appointmentId);

    List<MedicalRecord> findByPatient_Id(Long patientId);

    List<MedicalRecord> findByDoctor_Id(Long doctorId);
}
