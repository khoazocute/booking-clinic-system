package com.example.booking_clinic.common.exception;

public class OAuth2EmailRequiredException extends RuntimeException {

    public OAuth2EmailRequiredException(String message) {
        super(message);
    }
}
