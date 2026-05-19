package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.appointment.AppointmentResponse;
import com.example.booking_clinic.dto.appointment.CancelAppointmentResponse;
import com.example.booking_clinic.dto.appointment.CreateAppointmentRequest;
import com.example.booking_clinic.dto.appointment.UpdateAppointmentStatusRequest;
import com.example.booking_clinic.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // PATIENT đặt lịch
    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentResponse>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request) {

        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment created successfully", response));
    }

    // Xem chi tiết 1 lịch hẹn theo id
    @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<AppointmentResponse>> getById(
                @PathVariable Long id) {

        AppointmentResponse response = appointmentService.getAppointmentById(id);

        return ResponseEntity.ok(ApiResponse.success("Appointment fetched successfully", response));
        }


    // PATIENT xem lịch hẹn của mình
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyAppointments() {

        return ResponseEntity.ok(
                ApiResponse.success("My appointments fetched successfully",
                        appointmentService.getMyAppointments()));
    }

    // DOCTOR/ADMIN xem lịch hẹn của 1 bác sĩ
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(
                ApiResponse.success("Doctor appointments fetched successfully",
                        appointmentService.getAppointmentsByDoctor(doctorId)));
    }

    // ADMIN xem tất cả lịch hẹn
    @GetMapping
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success("All appointments fetched successfully", appointmentService.getAllAppointments()));
    }

    // DOCTOR/ADMIN cập nhật trạng thái lịch hẹn
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Appointment status updated successfully",
                        appointmentService.updateStatus(id, request)));
    }

    // PATIENT huỷ lịch hẹn của chính mình
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<CancelAppointmentResponse>> cancel(
            @PathVariable Long id) {

        CancelAppointmentResponse response = appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled successfully", response));
    }
}
