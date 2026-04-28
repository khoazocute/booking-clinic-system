package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.doctor.CreateDoctorRequest;
import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorProfileRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorStatusRequest;
import com.example.booking_clinic.dto.doctor_schedule.CreateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.DoctorScheduleResponse;
import com.example.booking_clinic.service.DoctorScheduleService;
import com.example.booking_clinic.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorScheduleService doctorScheduleService;

    // --- API của bạn (Doctor tự cập nhật Profile) ---
    @PatchMapping("/me")
    @PreAuthorize("hasAuthority('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateMyProfile(@RequestBody UpdateDoctorProfileRequest request) {
        DoctorResponse response = doctorService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Doctor profile updated successfully", response));
    }

    // --- API của nhóm (Quản lý Bác sĩ và Lịch làm việc) ---
    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctors(
            @RequestParam(required = false) Long specialtyId, 
            @RequestParam(required = false) String keyword) { 
        List<DoctorResponse> doctors = doctorService.getAllDoctors(specialtyId, keyword);
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully", doctors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        DoctorResponse doctor = doctorService.getDoctorById(id); 
        return ResponseEntity.ok(ApiResponse.success("Doctor fetched successfully", doctor));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        DoctorResponse doctor = doctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", doctor));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorRequest request) {
        DoctorResponse doctor = doctorService.updateDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully", doctor));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctorStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorStatusRequest request) {
        DoctorResponse doctor = doctorService.updateDoctorStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Doctor status updated successfully", doctor));
    }

    @GetMapping("/{id}/schedules")
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getSchedules(
            @PathVariable("id") Long doctorId,
            @RequestParam(required = false) LocalDate workDate) {
        List<DoctorScheduleResponse> schedules = doctorScheduleService.getSchedulesByDoctor(doctorId, workDate);
        return ResponseEntity.ok(ApiResponse.success("Schedules fetched successfully", schedules));
    }

    @PostMapping("/{id}/schedules")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> createSchedule(
            @PathVariable("id") Long doctorId,
            @Valid @RequestBody CreateDoctorScheduleRequest request) {
        
        CreateDoctorScheduleRequest scheduleRequest = new CreateDoctorScheduleRequest(
                doctorId,
                request.workDate(),
                request.startTime(),
                request.endTime()
        );
        
        DoctorScheduleResponse schedule = doctorScheduleService.createSchedule(scheduleRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Schedule created successfully", schedule));
    }
}