package com.example.booking_clinic.dto.prescription;

public record PrescriptionItemResponse(
        Long id,
        Long medicineId,
        String medicineName,
        Integer dosePerTime,
        Integer timesPerDay,
        Integer durationDays,
        Integer quantity,
        String dosageText,
        String instruction,
        String note
) {
}
