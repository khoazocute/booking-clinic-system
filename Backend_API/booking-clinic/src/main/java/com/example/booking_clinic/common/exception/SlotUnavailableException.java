package com.example.booking_clinic.common.exception;

/** The slot was taken by someone else (or is no longer bookable): HTTP 409, the UI refreshes the free slots. */
public class SlotUnavailableException extends RuntimeException {
    public SlotUnavailableException(String message) {
        super(message);
    }
}
