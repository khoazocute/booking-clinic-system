package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.prescription.CreatePrescriptionRequest;
import com.example.booking_clinic.dto.prescription.PrescriptionDetailResponse;
import com.example.booking_clinic.dto.prescription.PrescriptionResponse;
import com.example.booking_clinic.dto.prescription.UpdatePrescriptionRequest;
import com.example.booking_clinic.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(
            @Valid @RequestBody CreatePrescriptionRequest request) {
        
        PrescriptionResponse response = prescriptionService.createPrescription(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Prescription created successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionDetailResponse>> getPrescriptionById(
            @PathVariable Long id) {

        PrescriptionDetailResponse response = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(
                ApiResponse.success("Prescription fetched successfully", response));
    }

    @GetMapping("/medical-record/{medicalRecordId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionDetailResponse>> getPrescriptionByMedicalRecordId(
            @PathVariable Long medicalRecordId) {

        PrescriptionDetailResponse response = prescriptionService.getPrescriptionByMedicalRecordId(medicalRecordId);
        return ResponseEntity.ok(
                ApiResponse.success("Prescription fetched successfully", response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionDetailResponse>> updatePrescription(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePrescriptionRequest request) {

        PrescriptionDetailResponse response = prescriptionService.updatePrescription(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Prescription updated successfully", response));
    }
}
