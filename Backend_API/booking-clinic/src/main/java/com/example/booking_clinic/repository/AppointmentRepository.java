package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatient_Id(Long patientId);

    List<Appointment> findByDoctor_Id(Long doctorId);

    boolean existsByPatient_IdAndSchedule_Id(Long patientId, Long scheduleId);
}
