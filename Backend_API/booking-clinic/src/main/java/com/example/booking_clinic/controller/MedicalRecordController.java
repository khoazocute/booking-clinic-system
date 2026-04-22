package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.medical_record.CreateMedicalRecordRequest;
import com.example.booking_clinic.dto.medical_record.MedicalRecordResponse;
import com.example.booking_clinic.dto.medical_record.UpdateMedicalRecordRequest;
import com.example.booking_clinic.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    // DOCTOR tạo hồ sơ khám (tự động COMPLETE appointment)
    @PostMapping
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> create(
            @Valid @RequestBody CreateMedicalRecordRequest request) {

        MedicalRecordResponse response = medicalRecordService.createMedicalRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medical record created successfully", response));
    }

    // Xem chi tiết hồ sơ theo id
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Medical record fetched successfully",
                        medicalRecordService.getMedicalRecordById(id)));
    }

    // Lấy hồ sơ theo appointmentId
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getByAppointment(
            @PathVariable Long appointmentId) {

        return ResponseEntity.ok(
                ApiResponse.success("Medical record fetched successfully",
                        medicalRecordService.getMedicalRecordByAppointmentId(appointmentId)));
    }

    // DOCTOR cập nhật hồ sơ khám
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> update(
            @PathVariable Long id,
            @RequestBody UpdateMedicalRecordRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success("Medical record updated successfully",
                        medicalRecordService.updateMedicalRecord(id, request)));
    }
}
