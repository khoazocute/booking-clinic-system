package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Lịch hẹn của một bệnh nhân (xem "Lịch của tôi")
    List<Appointment> findByPatient_Id(Long patientId);

    // Lịch hẹn theo bác sĩ (query trực tiếp từ doctor_id)
    List<Appointment> findByDoctor_Id(Long doctorId);

    // Kiểm tra bệnh nhân đã đặt khung giờ này chưa (tên cột schedule_id)
    boolean existsByPatient_IdAndSchedule_Id(Long patientId, Long scheduleId);
}
