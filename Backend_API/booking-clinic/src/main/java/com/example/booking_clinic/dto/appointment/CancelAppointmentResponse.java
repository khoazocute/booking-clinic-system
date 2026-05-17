package com.example.booking_clinic.dto.appointment;

import java.math.BigDecimal;

public record CancelAppointmentResponse(
        Long appointmentId,
        int refundPercent,
        BigDecimal refundAmount,
        String refundNote
) {}
