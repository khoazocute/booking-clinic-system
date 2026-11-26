package com.example.booking_clinic.common.exception;

/** AI_Service is disabled, unreachable, timed out or answered with an error. Callers fall back. */
public class AiServiceUnavailableException extends RuntimeException {
    public AiServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
