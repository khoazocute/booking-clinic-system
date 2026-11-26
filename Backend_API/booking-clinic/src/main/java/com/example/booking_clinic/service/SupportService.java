package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.support.CreateSupportTicketRequest;
import com.example.booking_clinic.dto.support.SupportMessageRequest;
import com.example.booking_clinic.dto.support.SupportMessageResponse;
import com.example.booking_clinic.dto.support.SupportTicketResponse;

import java.util.List;

/** Human handoff: a patient talks to clinic staff (admins) when the AI assistant is not enough. */
public interface SupportService {

    /** Opens a ticket, or adds the message to the patient's ticket that is still open (one open ticket per patient). */
    SupportTicketResponse createTicket(CreateSupportTicketRequest request);

    /** The current patient's open ticket, or null. */
    SupportTicketResponse getMyActiveTicket();

    SupportTicketResponse getTicket(Long id);

    SupportMessageResponse addMessage(Long ticketId, SupportMessageRequest request);

    SupportTicketResponse closeTicket(Long id);

    /** Staff only: AI summary + draft reply grounded in clinic rules. Never sent automatically. */
    com.example.booking_clinic.dto.support.SupportAssistResult assist(Long ticketId);

    /** Staff inbox. {@code status}: OPEN (default), WAITING_STAFF, ANSWERED, CLOSED or ALL. */
    List<SupportTicketResponse> listTickets(String status);
}
