package com.example.booking_clinic.dto.support;

/**
 * Pushed over STOMP to /user/queue/support after the transaction commits.
 *
 * @param type    MESSAGE (a new message, in {@code message}), CREATED or CLOSED
 * @param message null unless type is MESSAGE
 */
public record SupportEvent(String type, Long ticketId, String status, SupportMessageResponse message) {
}
