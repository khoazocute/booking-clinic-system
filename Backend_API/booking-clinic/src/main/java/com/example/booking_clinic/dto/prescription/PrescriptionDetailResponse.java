package com.example.booking_clinic.dto.prescription;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionDetailResponse(
        Long id,
        Long medicalRecordId,
        Long doctorId,
        String doctorName,
        Long patientId,
        String patientName,
        String generalNote,
        String status,
        BigDecimal totalMedicineFee,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PrescriptionItemResponse> items
) {
}
