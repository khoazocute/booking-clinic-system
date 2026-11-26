package com.example.booking_clinic.dto.payment;

import jakarta.validation.constraints.NotNull;

public record VnpayUrlRequest(@NotNull(message = "Appointment ID is required") Long appointmentId) {
}
