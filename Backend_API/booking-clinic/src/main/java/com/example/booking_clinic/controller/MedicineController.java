package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.medicine.CreateMedicineRequest;
import com.example.booking_clinic.dto.medicine.MedicineResponse;
import com.example.booking_clinic.dto.medicine.UpdateMedicineRequest;
import com.example.booking_clinic.dto.medicine.UpdateMedicineStatusRequest;
import com.example.booking_clinic.service.MedicineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getAllMedicines() {
        return ResponseEntity.ok(
                ApiResponse.success("Medicines fetched successfully", medicineService.getAllMedicines())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Medicine fetched successfully", medicineService.getMedicineById(id))
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicineResponse>> createMedicine(
            @Valid @RequestBody CreateMedicineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medicine created successfully", medicineService.createMedicine(request)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicineRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Medicine updated successfully", medicineService.updateMedicine(id, request))
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateMedicineStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicineStatusRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Medicine status updated successfully", medicineService.updateMedicineStatus(id, request))
        );
    }
}
