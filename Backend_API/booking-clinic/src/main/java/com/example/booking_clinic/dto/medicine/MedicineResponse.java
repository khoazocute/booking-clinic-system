package com.example.booking_clinic.dto.medicine;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MedicineResponse(
        Long id,
        String name,
        BigDecimal unitPrice,
        String unit,
        String status,
        Integer stockQuantity,
        String stockStatus,
        LocalDateTime createdAt
) {
}
