package com.example.booking_clinic.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "doctor_schedules") // Tên bảng trong database như trong ảnh
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thiết lập khóa ngoại tới bảng doctor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // DATE trong DB tương ứng với LocalDate trong Java
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    // TIME trong DB tương ứng với LocalTime trong Java
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    // VARCHAR(20) trong DB
    @Column(nullable = false, length = 20)
    private String status;

    // Mặc dù trong ảnh để DATE? nhưng thường created_at lưu cả ngày lẫn giờ
    // Tôi giữ nguyên định dạng LocalDateTime giống bảng User của bạn cho đồng nhất
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Tự động gán thời gian khi tạo mới bản ghi
    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    // Tự động gán thời gian khi cập nhật bản ghi
    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}