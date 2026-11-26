package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.support.CreateSupportTicketRequest;
import com.example.booking_clinic.dto.support.SupportMessageRequest;
import com.example.booking_clinic.dto.support.SupportMessageResponse;
import com.example.booking_clinic.dto.support.SupportTicketResponse;
import com.example.booking_clinic.service.SupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Human handoff between patients and clinic staff. Roles are enforced in SecurityConfig and in the service. */
@RestController
@RequestMapping("/api/v1/support/tickets")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping
    public ResponseEntity<ApiResponse<SupportTicketResponse>> createTicket(
            @Valid @RequestBody CreateSupportTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Support request sent", supportService.createTicket(request)));
    }

    @GetMapping("/me/active")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> getMyActiveTicket() {
        return ResponseEntity.ok(ApiResponse.success("Active support ticket", supportService.getMyActiveTicket()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> listTickets(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Support tickets", supportService.listTickets(status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Support ticket", supportService.getTicket(id)));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<SupportMessageResponse>> addMessage(
            @PathVariable Long id, @Valid @RequestBody SupportMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", supportService.addMessage(id, request)));
    }

    /** ADMIN: AI summary + draft reply (agent assist). The draft is shown to staff, never sent automatically. */
    @PostMapping("/{id}/assist")
    public ResponseEntity<ApiResponse<com.example.booking_clinic.dto.support.SupportAssistResult>> assist(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("AI draft", supportService.assist(id)));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> closeTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Support ticket closed", supportService.closeTicket(id)));
    }
}
