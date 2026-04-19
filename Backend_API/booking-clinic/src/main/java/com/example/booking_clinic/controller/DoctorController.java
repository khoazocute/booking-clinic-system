package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorProfileRequest;
import com.example.booking_clinic.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @PatchMapping("/me")
    @PreAuthorize("hasAuthority('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateMyProfile(@RequestBody UpdateDoctorProfileRequest request) {
        DoctorResponse response = doctorService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Doctor profile updated successfully", response));
    }
}
