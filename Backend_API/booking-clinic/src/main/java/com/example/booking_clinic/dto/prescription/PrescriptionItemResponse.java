package com.example.booking_clinic.dto.prescription;

import java.math.BigDecimal;

public record PrescriptionItemResponse(
        Long id,
        Long medicineId,
        String medicineName,
        Integer dosePerTime,
        Integer timesPerDay,
        Integer durationDays,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String dosageText,
        String instruction,
        String note
) {
}
