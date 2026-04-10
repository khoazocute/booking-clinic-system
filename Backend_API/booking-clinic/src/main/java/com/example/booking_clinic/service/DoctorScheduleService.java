package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.doctor_schedule.CreateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.DoctorScheduleResponse;
import com.example.booking_clinic.dto.doctor_schedule.UpdateDoctorScheduleRequest;

import java.time.LocalDate;
import java.util.List;

public interface DoctorScheduleService {
    // Lấy tất cả lịch của 1 bác sĩ (có thể lọc theo ngày)
    List<DoctorScheduleResponse> getSchedulesByDoctor(Long doctorId, LocalDate workDate);

    // Tạo lịch làm việc mới
    DoctorScheduleResponse createSchedule(CreateDoctorScheduleRequest request);

    // Sửa lịch làm việc
    DoctorScheduleResponse updateSchedule(Long id, UpdateDoctorScheduleRequest request);

    // Xoá/Huỷ lịch làm việc
    void deleteSchedule(Long id);
}