package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.payment.VnpayResultResponse;
import com.example.booking_clinic.dto.payment.VnpayUrlRequest;
import com.example.booking_clinic.service.impl.VnpayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/vnpay")
@RequiredArgsConstructor
public class VnpayController {

    private final VnpayService vnpayService;

    /** PATIENT: a signed VNPay URL for their own pending appointment. */
    @PostMapping("/url")
    public ResponseEntity<ApiResponse<Map<String, String>>> createUrl(@Valid @RequestBody VnpayUrlRequest request,
                                                                      HttpServletRequest http) {
        String url = vnpayService.createPaymentUrl(request.appointmentId(), clientIp(http));
        return ResponseEntity.ok(ApiResponse.success("VNPay payment URL", Map.of("paymentUrl", url)));
    }

    /** PATIENT: the query parameters VNPay appended to the return URL, verified here (never in the browser). */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VnpayResultResponse>> verify(@RequestBody Map<String, String> params) {
        VnpayResultResponse result = vnpayService.verifyReturn(params);
        return ResponseEntity.ok(ApiResponse.success(result.message(), result));
    }

    /** VNPay server-to-server notification (public; authenticated by the HMAC signature). */
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(vnpayService.handleIpn(params));
    }

    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
