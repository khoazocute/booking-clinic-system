package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatient_Id(Long patientId);

    List<Appointment> findByDoctor_Id(Long doctorId);

    boolean existsByPatient_IdAndSchedule_Id(Long patientId, Long scheduleId);

    @Query("SELECT a FROM Appointment a WHERE a.status = :status AND a.paymentDeadline IS NOT NULL AND a.paymentDeadline < :now")
    List<Appointment> findExpiredPendingAppointments(
            @Param("status") AppointmentStatus status,
            @Param("now") LocalDateTime now);
}
