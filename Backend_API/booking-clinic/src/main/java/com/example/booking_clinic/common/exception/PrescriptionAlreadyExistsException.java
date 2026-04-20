package com.example.booking_clinic.common.exception;

public class PrescriptionAlreadyExistsException extends RuntimeException {
    public PrescriptionAlreadyExistsException(String message) {
        super(message);
    }
}
