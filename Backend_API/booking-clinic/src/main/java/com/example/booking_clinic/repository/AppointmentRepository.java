package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatient_IdOrderByCreatedAtDescIdDesc(Long patientId);

    List<Appointment> findByDoctor_IdOrderByCreatedAtDescIdDesc(Long doctorId);

    boolean existsByPatient_IdAndSchedule_IdAndStatusIn(Long patientId, Long scheduleId, List<AppointmentStatus> statuses);

    boolean existsBySchedule_IdAndStatusIn(Long scheduleId, List<AppointmentStatus> statuses);

    boolean existsBySchedule_Id(Long scheduleId);

    /** Does the patient already have an active appointment overlapping this time (with any doctor)? */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a JOIN a.schedule s " +
            "WHERE a.patient.id = :patientId AND a.status IN :statuses AND s.workDate = :date " +
            "AND s.startTime < :endTime AND s.endTime > :startTime")
    boolean existsOverlappingForPatient(
            @Param("patientId") Long patientId,
            @Param("statuses") List<AppointmentStatus> statuses,
            @Param("date") LocalDate date,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime);

    @Query("SELECT a FROM Appointment a WHERE a.status = :status AND a.paymentDeadline IS NOT NULL AND a.paymentDeadline < :now")
    List<Appointment> findExpiredPendingAppointments(
            @Param("status") AppointmentStatus status,
            @Param("now") LocalDateTime now);

    /** Appointments on the given days that have not been reminded yet (with everything the message needs). */
    @Query("SELECT a FROM Appointment a JOIN FETCH a.schedule s JOIN FETCH a.patient p JOIN FETCH p.user " +
            "JOIN FETCH a.doctor d JOIN FETCH d.user " +
            "WHERE a.status IN :statuses AND a.reminderSentAt IS NULL AND s.workDate BETWEEN :from AND :to")
    List<Appointment> findReminderCandidates(
            @Param("statuses") List<AppointmentStatus> statuses,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** Visits completed in the window that have not had their follow-up yet. */
    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient p JOIN FETCH p.user JOIN FETCH a.doctor d JOIN FETCH d.user " +
            "WHERE a.status = :status AND a.followUpSentAt IS NULL AND a.updatedAt BETWEEN :from AND :to")
    List<Appointment> findFollowUpCandidates(
            @Param("status") AppointmentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT a FROM Appointment a " +
            "WHERE a.status IN :statuses " +
            "AND a.appointmentDate < :today")
    List<Appointment> findPastActiveAppointments(
            @Param("statuses") List<AppointmentStatus> statuses,
            @Param("today") LocalDate today);
}
