package com.example.booking_clinic.dto.prescription;

import jakarta.validation.Valid;
import java.util.List;

public record UpdatePrescriptionRequest(
        String generalNote,

        @Valid
        List<PrescriptionItemDto> items
) {
}
