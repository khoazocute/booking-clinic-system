package com.example.booking_clinic.dto.medicine;

import java.math.BigDecimal;

public record MedicineResponse(
        Long id,
        String name,
        BigDecimal unitPrice,
        String unit,
        String status
) {
}
