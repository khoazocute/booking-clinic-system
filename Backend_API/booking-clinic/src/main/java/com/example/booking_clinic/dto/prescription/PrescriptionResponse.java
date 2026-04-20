package com.example.booking_clinic.dto.prescription;

import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionResponse(
        Long id,
        Long medicalRecordId,
        String generalNote,
        LocalDateTime createdAt,
        List<PrescriptionItemResponse> items
) {
}
