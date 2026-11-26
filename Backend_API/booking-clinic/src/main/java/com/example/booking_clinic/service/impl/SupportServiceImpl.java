package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.support.CreateSupportTicketRequest;
import com.example.booking_clinic.dto.support.SupportEvent;
import com.example.booking_clinic.dto.support.SupportMessageRequest;
import com.example.booking_clinic.dto.support.SupportMessageResponse;
import com.example.booking_clinic.dto.support.SupportTicketResponse;
import com.example.booking_clinic.entity.SupportMessage;
import com.example.booking_clinic.entity.SupportTicket;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.SupportTicketStatus;
import com.example.booking_clinic.repository.SupportMessageRepository;
import com.example.booking_clinic.repository.SupportTicketRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.common.exception.TooManyRequestsException;
import com.example.booking_clinic.dto.support.SupportAssistResult;
import com.example.booking_clinic.service.AiRateLimiter;
import com.example.booking_clinic.service.AiServiceGateway;
import com.example.booking_clinic.service.NotificationService;
import com.example.booking_clinic.service.SupportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupportServiceImpl implements SupportService {

    static final Set<String> REASONS = Set.of(
            "PATIENT_REQUEST", "COMPLAINT", "PAYMENT_ISSUE", "OUT_OF_SCOPE", "AGENT_GAVE_UP", "AI_UNAVAILABLE");
    static final List<SupportTicketStatus> OPEN = List.of(SupportTicketStatus.WAITING_STAFF, SupportTicketStatus.ANSWERED);
    static final String QUEUE = "/queue/support";
    private static final int PREVIEW_LENGTH = 120;

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AiRateLimiter rateLimiter;
    private final AiServiceGateway aiServiceGateway;

    @Override
    @Transactional
    public SupportTicketResponse createTicket(CreateSupportTicketRequest request) {
        User patient = currentUser();
        rateLimiter.check("support:user:" + patient.getId());

        SupportTicket open = ticketRepository
                .findFirstByPatient_IdAndStatusInOrderByCreatedAtDesc(patient.getId(), OPEN)
                .orElse(null);
        if (open != null) {
            // one open ticket per patient: a second handoff continues the same conversation with staff
            if (open.getAiTranscript() == null) {
                open.setAiTranscript(formatTranscript(request.transcript()));
            }
            appendMessage(open, patient, "PATIENT", request.message(), false);
            return toDetail(open);
        }

        SupportTicket ticket = ticketRepository.save(SupportTicket.builder()
                .patient(patient)
                .status(SupportTicketStatus.WAITING_STAFF)
                .reason(request.reason() != null && REASONS.contains(request.reason()) ? request.reason() : "PATIENT_REQUEST")
                .aiTranscript(formatTranscript(request.transcript()))
                .build());
        SupportMessageResponse first = saveMessage(ticket, patient, "PATIENT", request.message(), false);

        notificationService.createNotificationForAdmins(
                "Yêu cầu hỗ trợ mới",
                displayName(patient) + ": " + preview(request.message()),
                "SUPPORT", "SUPPORT_TICKET", ticket.getId());
        pushToStaff(new SupportEvent("CREATED", ticket.getId(), ticket.getStatus().name(), first));
        return toDetail(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public SupportTicketResponse getMyActiveTicket() {
        User patient = currentUser();
        return ticketRepository.findFirstByPatient_IdAndStatusInOrderByCreatedAtDesc(patient.getId(), OPEN)
                .map(this::toDetail)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public SupportTicketResponse getTicket(Long id) {
        SupportTicket ticket = findTicket(id);
        authorize(ticket, currentUser());
        return toDetail(ticket);
    }

    @Override
    @Transactional
    public SupportMessageResponse addMessage(Long ticketId, SupportMessageRequest request) {
        User user = currentUser();
        SupportTicket ticket = findTicket(ticketId);
        String senderRole = authorize(ticket, user);
        if (ticket.getStatus() == SupportTicketStatus.CLOSED) {
            throw new IllegalStateException("Yêu cầu hỗ trợ đã đóng, vui lòng tạo yêu cầu mới");
        }
        if ("PATIENT".equals(senderRole)) {
            rateLimiter.check("support:user:" + user.getId());
        }
        boolean aiAssisted = "STAFF".equals(senderRole) && Boolean.TRUE.equals(request.aiAssisted());
        return appendMessage(ticket, user, senderRole, request.content(), aiAssisted);
    }

    @Override
    // no transaction: nothing here needs one, and a DB connection must not wait on the LLM
    public SupportAssistResult assist(Long ticketId) {
        User staff = currentUser();
        if (!isAdmin(staff)) {
            throw new AccessDeniedException("Only clinic staff can use the reply assistant");
        }
        SupportTicket ticket = findTicket(ticketId);
        rateLimiter.check("assist:user:" + staff.getId());
        if (rateLimiter.consumeDailyQuota("assist:user:" + staff.getId()) != AiRateLimiter.Quota.OK) {
            throw new TooManyRequestsException("Đã hết lượt gợi ý AI hôm nay");
        }

        List<java.util.Map<String, String>> thread = messageRepository.findByTicket_IdOrderByCreatedAtAsc(ticket.getId())
                .stream()
                .map(m -> java.util.Map.of("role", "STAFF".equals(m.getSenderRole()) ? "staff" : "patient",
                        "content", m.getContent()))
                .toList();
        if (thread.size() > 40) {
            thread = thread.subList(thread.size() - 40, thread.size());
        }
        java.util.Map<String, Object> request = new java.util.HashMap<>();
        request.put("messages", thread);
        request.put("reason", ticket.getReason());
        if (ticket.getAiTranscript() != null) {
            String transcript = ticket.getAiTranscript();
            request.put("aiTranscript", transcript.length() > 39_000 ? transcript.substring(transcript.length() - 39_000) : transcript);
        }
        try {
            return aiServiceGateway.assist(request);
        } catch (AiServiceUnavailableException e) {
            throw new IllegalStateException("Trợ lý AI tạm thời không khả dụng, vui lòng tự soạn câu trả lời");
        }
    }

    @Override
    @Transactional
    public SupportTicketResponse closeTicket(Long id) {
        User user = currentUser();
        SupportTicket ticket = findTicket(id);
        String role = authorize(ticket, user);
        if (ticket.getStatus() != SupportTicketStatus.CLOSED) {
            ticket.setStatus(SupportTicketStatus.CLOSED);
            ticket.setClosedAt(LocalDateTime.now());
            ticketRepository.save(ticket);
            SupportEvent event = new SupportEvent("CLOSED", ticket.getId(), ticket.getStatus().name(), null);
            if ("STAFF".equals(role)) {
                pushTo(ticket.getPatient().getEmail(), event);
            }
            pushToStaff(event);
        }
        return toDetail(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listTickets(String status) {
        String filter = status == null || status.isBlank() ? "OPEN" : status.trim().toUpperCase();
        List<SupportTicket> tickets = switch (filter) {
            case "ALL" -> ticketRepository.findAllByOrderByUpdatedAtDesc();
            case "OPEN" -> ticketRepository.findByStatusInOrderByUpdatedAtDesc(OPEN);
            default -> ticketRepository.findByStatusInOrderByUpdatedAtDesc(List.of(parseStatus(filter)));
        };
        // patients waiting for staff first, then most recent activity
        return tickets.stream()
                .sorted(Comparator.comparing((SupportTicket t) -> t.getStatus() != SupportTicketStatus.WAITING_STAFF))
                .map(this::toSummary)
                .toList();
    }

    // ---------- internals ----------

    private SupportMessageResponse appendMessage(SupportTicket ticket, User sender, String senderRole, String content,
                                                 boolean aiAssisted) {
        if ("STAFF".equals(senderRole)) {
            ticket.setStatus(SupportTicketStatus.ANSWERED);
            if (ticket.getAssignedStaff() == null) {
                ticket.setAssignedStaff(sender);
            }
        } else {
            ticket.setStatus(SupportTicketStatus.WAITING_STAFF);
        }
        ticket.setUpdatedAt(LocalDateTime.now()); // also bumps the inbox order when the status is unchanged
        ticketRepository.save(ticket);

        SupportMessageResponse message = saveMessage(ticket, sender, senderRole, content, aiAssisted);
        SupportEvent event = new SupportEvent("MESSAGE", ticket.getId(), ticket.getStatus().name(), message);
        if ("STAFF".equals(senderRole)) {
            notificationService.createNotification(ticket.getPatient(), "Tư vấn viên đã trả lời",
                    preview(content), "SUPPORT", "SUPPORT_TICKET", ticket.getId());
            pushTo(ticket.getPatient().getEmail(), event);
        }
        pushToStaff(event);
        return message;
    }

    private SupportMessageResponse saveMessage(SupportTicket ticket, User sender, String senderRole, String content,
                                               boolean aiAssisted) {
        SupportMessage saved = messageRepository.save(SupportMessage.builder()
                .ticket(ticket)
                .sender(sender)
                .senderRole(senderRole)
                .content(content.trim())
                .aiAssisted(aiAssisted)
                .build());
        return toMessage(saved);
    }

    /** @return PATIENT or STAFF, the role this user acts in on the ticket */
    private String authorize(SupportTicket ticket, User user) {
        if (isAdmin(user)) {
            return "STAFF";
        }
        if (ticket.getPatient().getId().equals(user.getId())) {
            return "PATIENT";
        }
        throw new AccessDeniedException("Bạn không có quyền truy cập yêu cầu hỗ trợ này");
    }

    private static boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName().trim());
    }

    private SupportTicket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found with id: " + id));
    }

    private static SupportTicketStatus parseStatus(String status) {
        try {
            return SupportTicketStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
    }

    static String formatTranscript(List<AiChatMessage> transcript) {
        if (transcript == null || transcript.isEmpty()) {
            return null;
        }
        StringBuilder text = new StringBuilder();
        for (AiChatMessage m : transcript) {
            text.append("user".equals(m.role()) ? "Bệnh nhân: " : "Trợ lý AI: ")
                    .append(m.content().trim())
                    .append("\n\n");
        }
        return text.toString().trim();
    }

    private static String preview(String text) {
        String flat = text.trim().replaceAll("\\s+", " ");
        return flat.length() <= PREVIEW_LENGTH ? flat : flat.substring(0, PREVIEW_LENGTH - 1) + "…";
    }

    private static String displayName(User user) {
        return user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail();
    }

    // ---------- realtime push (after commit, so a client that refetches sees the new row) ----------

    private void pushToStaff(SupportEvent event) {
        afterCommit(() -> userRepository.findByRole_Name("ADMIN").forEach(admin -> send(admin.getEmail(), event)));
    }

    private void pushTo(String email, SupportEvent event) {
        afterCommit(() -> send(email, event));
    }

    private void send(String email, SupportEvent event) {
        try {
            messagingTemplate.convertAndSendToUser(email, QUEUE, event);
        } catch (Exception e) {
            log.debug("support push to {} failed: {}", email, e.getMessage()); // clients also poll
        }
    }

    private static void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    // ---------- mapping ----------

    private SupportTicketResponse toDetail(SupportTicket ticket) {
        List<SupportMessageResponse> messages = messageRepository.findByTicket_IdOrderByCreatedAtAsc(ticket.getId())
                .stream().map(this::toMessage).toList();
        String last = messages.isEmpty() ? null : preview(messages.get(messages.size() - 1).content());
        return toResponse(ticket, last, messages);
    }

    private SupportTicketResponse toSummary(SupportTicket ticket) {
        String last = messageRepository.findFirstByTicket_IdOrderByCreatedAtDesc(ticket.getId())
                .map(m -> preview(m.getContent())).orElse(null);
        return toResponse(ticket, last, List.of());
    }

    private SupportTicketResponse toResponse(SupportTicket t, String lastMessage, List<SupportMessageResponse> messages) {
        User p = t.getPatient();
        return new SupportTicketResponse(t.getId(), t.getStatus().name(), t.getReason(), p.getId(), displayName(p),
                p.getEmail(), p.getPhone(), t.getAssignedStaff() == null ? null : displayName(t.getAssignedStaff()),
                t.getAiTranscript(), lastMessage, t.getCreatedAt(), t.getUpdatedAt(), t.getClosedAt(), messages);
    }

    private SupportMessageResponse toMessage(SupportMessage m) {
        return new SupportMessageResponse(m.getId(), m.getTicket().getId(), m.getSenderRole(),
                "STAFF".equals(m.getSenderRole()) ? "Tư vấn viên " + displayName(m.getSender()) : displayName(m.getSender()),
                m.getContent(), m.getCreatedAt(), Boolean.TRUE.equals(m.getAiAssisted()));
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User principal)) {
            throw new AccessDeniedException("Authentication required");
        }
        return userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }
}
