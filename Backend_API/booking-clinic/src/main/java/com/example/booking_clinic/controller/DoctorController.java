package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.doctor.CreateDoctorRequest;
import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorStatusRequest;
import com.example.booking_clinic.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    // Gộp các chức năng xem danh sách, tìm kiếm, lọc vào đây
    // Trả về HTTP Response,  data là DoctorResponse
    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctors(
            @RequestParam(required = false) Long specialtyId, //Lọc theo chuyên khoa, ?speciltyId
            @RequestParam(required = false) String keyword) { // Tìm kiếm bác sĩ , ?keyword
        List<DoctorResponse> doctors = doctorService.getAllDoctors(specialtyId, keyword);//gọi service lấy danh sách bác sĩ
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully", doctors));
    }

    //@PathVariable Long id lấy id từ URL path
    @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
            DoctorResponse doctor = doctorService.getDoctorById(id); //gọi service
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
}
