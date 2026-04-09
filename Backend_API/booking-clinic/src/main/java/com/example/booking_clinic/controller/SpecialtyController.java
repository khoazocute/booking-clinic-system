package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.specialty.CreateSpecialtyRequest;
import com.example.booking_clinic.dto.specialty.SpecialtyResponse;
import com.example.booking_clinic.dto.specialty.UpdateSpecialtyRequest;
import com.example.booking_clinic.service.SpecialtyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/specialties")
@RequiredArgsConstructor
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SpecialtyResponse>>> getAllSpecialties() {
        List<SpecialtyResponse> specialties = specialtyService.getAllSpecialties();
        return ResponseEntity.ok(ApiResponse.success("Specialties fetched successfully", specialties));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SpecialtyResponse>> getSpecialtyById(@PathVariable Long id) {
        SpecialtyResponse specialty = specialtyService.getSpecialtyById(id);
        return ResponseEntity.ok(ApiResponse.success("Specialty fetched successfully", specialty));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SpecialtyResponse>> createSpecialty(
            @Valid @RequestBody CreateSpecialtyRequest request) {
        SpecialtyResponse specialty = specialtyService.createSpecialty(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Specialty created successfully", specialty));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SpecialtyResponse>> updateSpecialty(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSpecialtyRequest request) {
        SpecialtyResponse specialty = specialtyService.updateSpecialty(id, request);
        return ResponseEntity.ok(ApiResponse.success("Specialty updated successfully", specialty));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSpecialty(@PathVariable Long id) {
        specialtyService.deleteSpecialty(id);
        return ResponseEntity.ok(ApiResponse.success("Specialty deleted successfully", null));
    }
}
