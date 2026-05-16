package com.example.booking_clinic.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.payment.CreatePaymentRequest;
import com.example.booking_clinic.dto.payment.UpdatePaymentStatusRequest;
import com.example.booking_clinic.dto.payment.PaymentResponse;
import com.example.booking_clinic.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<PaymentResponse>>> getAllPayments() {
        return ResponseEntity.ok(ApiResponse.success("Payments fetched successfully", paymentService.getAllPayments()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment created successfully", paymentService.createPayment(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable Long id) {
        return ResponseEntity
                .ok(ApiResponse.success("Payment fetched successfully", paymentService.getPaymentById(id)));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByAppointmentId(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(ApiResponse.success("Payment fetched successfully",
                paymentService.getPaymentByAppointmentId(appointmentId)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> updatePaymentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment status updated successfully", 
                paymentService.updatePaymentStatus(id, request)));
    }
}
