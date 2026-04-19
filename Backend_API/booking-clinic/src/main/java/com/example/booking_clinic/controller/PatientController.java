package com.example.booking_clinic.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.patient.PatientResponse;
import com.example.booking_clinic.dto.patient.UpdatePatientRequest;
import com.example.booking_clinic.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {
    private final PatientService patientService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PatientResponse>> getMyProfile() {
        PatientResponse profile = patientService.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success("Patient profile fetched successfull", profile));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<PatientResponse>> updateMyProfile(
        @RequestBody UpdatePatientRequest request){
        PatientResponse profile = patientService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Patient profile updated successfull", profile));
    }
}
