package com.example.booking_clinic.common.exception;

/** The request conflicts with the current state of a resource (HTTP 409). */
public class ResourceConflictException extends RuntimeException {
    public ResourceConflictException(String message) {
        super(message);
    }
}
