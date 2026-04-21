package com.example.booking_clinic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK → patients (bệnh nhân đặt lịch)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // FK → doctors (bác sĩ được đặt, denormalized để query nhanh)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // FK → doctor_schedules (khung giờ cụ thể) — tên cột: schedule_id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private DoctorSchedule schedule;

    // Ngày hẹn khám (lấy từ schedule.workDate khi tạo)
    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    // Lý do khám / triệu chứng
    @Column(columnDefinition = "TEXT")
    private String reason;

    // PENDING | CONFIRMED | CANCELLED | COMPLETED
    @Column(nullable = false, length = 20)
    private String status;

    // Lý do huỷ (chỉ điền khi status = CANCELLED)
    @Column(name = "cancel_reason", columnDefinition = "MEDIUMTEXT")
    private String cancelReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) status = "PENDING";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
