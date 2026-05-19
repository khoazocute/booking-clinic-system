package com.example.booking_clinic.dto.medicine;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateMedicineRequest(
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        @DecimalMin(value = "0.0", inclusive = false, message = "Unit price must be greater than 0")
        BigDecimal unitPrice,

        @Size(max = 30, message = "Unit must not exceed 30 characters")
        String unit,

        @Min(value = 0, message = "Stock quantity must be >= 0")
        Integer stockQuantity
) {
}
