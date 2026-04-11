package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.doctor_schedule.CreateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.DoctorScheduleResponse;
import com.example.booking_clinic.dto.doctor_schedule.UpdateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.UpdateStatusDoctorScheduleRequest;
import com.example.booking_clinic.service.DoctorScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor-schedules")
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;


    // Tạo lịch mới
    @PostMapping
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> createSchedule(
            @Valid @RequestBody CreateDoctorScheduleRequest request) {
        DoctorScheduleResponse schedule = scheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Schedule created successfully", schedule));
    }

    // Sửa lịch
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorScheduleRequest request) {
        DoctorScheduleResponse schedule = scheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.success("Schedule updated successfully", schedule));
    }

    // Xoá lịch
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("Schedule deleted successfully", null));
    }

    // Sửa trạng thái lịch làm việc
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> updateScheduleStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusDoctorScheduleRequest request) {
        DoctorScheduleResponse schedule = scheduleService.updateScheduleStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Schedule status updated successfully", schedule));
    }
}