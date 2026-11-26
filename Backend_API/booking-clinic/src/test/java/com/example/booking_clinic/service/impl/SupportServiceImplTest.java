package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.TooManyRequestsException;
import com.example.booking_clinic.dto.ai.AiChatMessage;
import com.example.booking_clinic.dto.support.CreateSupportTicketRequest;
import com.example.booking_clinic.dto.support.SupportMessageRequest;
import com.example.booking_clinic.dto.support.SupportTicketResponse;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.SupportMessage;
import com.example.booking_clinic.entity.SupportTicket;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.SupportTicketStatus;
import com.example.booking_clinic.repository.SupportMessageRepository;
import com.example.booking_clinic.repository.SupportTicketRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.AiRateLimiter;
import com.example.booking_clinic.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SupportServiceImplTest {

    @Mock private SupportTicketRepository tickets;
    @Mock private SupportMessageRepository messages;
    @Mock private UserRepository users;
    @Mock private NotificationService notifications;
    @Mock private SimpMessagingTemplate messaging;
    @Mock private AiRateLimiter rateLimiter;
    @Mock private com.example.booking_clinic.service.AiServiceGateway aiGateway;
    @InjectMocks private SupportServiceImpl service;

    private final User patient = user(1L, "patient@example.test", "PATIENT", "Nguyễn Văn A");
    private final User otherPatient = user(2L, "other@example.test", "PATIENT", "Trần Thị B");
    private final User staff = user(9L, "admin@example.test", "ADMIN", "Lê Admin");
    private final AtomicLong ids = new AtomicLong(100);

    private static User user(long id, String email, String role, String name) {
        return User.builder().id(id).email(email).fullName(name).role(Role.builder().name(role).build()).build();
    }

    @BeforeEach
    void setUp() {
        for (User u : List.of(patient, otherPatient, staff)) {
            when(users.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
        }
        when(users.findByRole_Name("ADMIN")).thenReturn(List.of(staff));
        when(tickets.save(any(SupportTicket.class))).thenAnswer(inv -> {
            SupportTicket t = inv.getArgument(0);
            if (t.getId() == null) t.setId(ids.incrementAndGet());
            return t;
        });
        when(messages.save(any(SupportMessage.class))).thenAnswer(inv -> {
            SupportMessage m = inv.getArgument(0);
            m.setId(ids.incrementAndGet());
            return m;
        });
        when(tickets.findFirstByPatient_IdAndStatusInOrderByCreatedAtDesc(anyLong(), any())).thenReturn(Optional.empty());
        when(rateLimiter.consumeDailyQuota(anyString())).thenReturn(AiRateLimiter.Quota.OK);
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private static void loginAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }

    private SupportTicket openTicket(User owner, SupportTicketStatus status) {
        SupportTicket ticket = SupportTicket.builder().id(50L).patient(owner).status(status).reason("PATIENT_REQUEST").build();
        when(tickets.findById(50L)).thenReturn(Optional.of(ticket));
        return ticket;
    }

    @Test
    void handoffOpensTicketWithTheSharedAiChatAndNotifiesStaff() {
        loginAs(patient);
        var transcript = List.of(new AiChatMessage("user", "Tôi bị trừ tiền 2 lần"),
                new AiChatMessage("assistant", "Bạn bấm Gặp tư vấn viên nhé."));

        SupportTicketResponse response = service.createTicket(
                new CreateSupportTicketRequest("Tôi bị trừ tiền 2 lần cho lịch hẹn 15", "PAYMENT_ISSUE", transcript));

        assertEquals("WAITING_STAFF", response.status());
        assertEquals("PAYMENT_ISSUE", response.reason());
        assertEquals("Bệnh nhân: Tôi bị trừ tiền 2 lần\n\nTrợ lý AI: Bạn bấm Gặp tư vấn viên nhé.", response.aiTranscript());
        verify(notifications).createNotificationForAdmins(eq("Yêu cầu hỗ trợ mới"), anyString(), eq("SUPPORT"),
                eq("SUPPORT_TICKET"), eq(response.id()));
        verify(rateLimiter).check("support:user:1");
    }

    @Test
    void chatIsNotSharedUnlessThePatientChoseToAndUnknownReasonsAreNormalized() {
        loginAs(patient);
        SupportTicketResponse response = service.createTicket(new CreateSupportTicketRequest("Cần hỗ trợ", "HACKED", null));
        assertNull(response.aiTranscript());
        assertEquals("PATIENT_REQUEST", response.reason());
    }

    @Test
    void secondHandoffContinuesTheOpenTicketInsteadOfOpeningAnother() {
        loginAs(patient);
        SupportTicket open = openTicket(patient, SupportTicketStatus.ANSWERED);
        when(tickets.findFirstByPatient_IdAndStatusInOrderByCreatedAtDesc(eq(1L), any())).thenReturn(Optional.of(open));

        SupportTicketResponse response = service.createTicket(new CreateSupportTicketRequest("Còn một việc nữa", null, null));

        assertEquals(50L, response.id());
        assertEquals(SupportTicketStatus.WAITING_STAFF, open.getStatus()); // back in the staff queue
        verify(notifications, never()).createNotificationForAdmins(any(), any(), any(), any(), any());
    }

    @Test
    void patientCannotReadOrWriteAnotherPatientsTicket() {
        openTicket(otherPatient, SupportTicketStatus.WAITING_STAFF);
        loginAs(patient);

        assertThrows(AccessDeniedException.class, () -> service.getTicket(50L));
        assertThrows(AccessDeniedException.class, () -> service.addMessage(50L, new SupportMessageRequest("xin chào")));
        verify(messages, never()).save(any());
    }

    @Test
    void staffReplyMarksTicketAnsweredAssignsStaffAndNotifiesThePatient() {
        SupportTicket ticket = openTicket(patient, SupportTicketStatus.WAITING_STAFF);
        loginAs(staff);

        var reply = service.addMessage(50L, new SupportMessageRequest("Chúng tôi đã hoàn lại khoản trừ trùng."));

        assertEquals("STAFF", reply.senderRole());
        assertEquals("Tư vấn viên Lê Admin", reply.senderName());
        assertEquals(SupportTicketStatus.ANSWERED, ticket.getStatus());
        assertSame(staff, ticket.getAssignedStaff());
        verify(notifications).createNotification(eq(patient), eq("Tư vấn viên đã trả lời"), anyString(),
                eq("SUPPORT"), eq("SUPPORT_TICKET"), eq(50L));
        verify(rateLimiter, never()).check(anyString()); // staff are not rate limited
    }

    @Test
    void closedTicketsAreReadOnly() {
        openTicket(patient, SupportTicketStatus.CLOSED);
        loginAs(patient);
        assertThrows(IllegalStateException.class, () -> service.addMessage(50L, new SupportMessageRequest("còn đó không?")));
    }

    @Test
    void patientMessagesAreRateLimited() {
        openTicket(patient, SupportTicketStatus.ANSWERED);
        loginAs(patient);
        doThrow(new TooManyRequestsException("slow down")).when(rateLimiter).check("support:user:1");

        assertThrows(TooManyRequestsException.class, () -> service.addMessage(50L, new SupportMessageRequest("spam")));
        verify(messages, never()).save(any());
    }

    @Test
    void eitherSideCanCloseAndTheInboxPutsWaitingPatientsFirst() {
        SupportTicket ticket = openTicket(patient, SupportTicketStatus.ANSWERED);
        loginAs(patient);
        assertEquals("CLOSED", service.closeTicket(50L).status());
        assertTrue(ticket.getClosedAt() != null);

        SupportTicket answered = SupportTicket.builder().id(1L).patient(patient).status(SupportTicketStatus.ANSWERED).reason("X").build();
        SupportTicket waiting = SupportTicket.builder().id(2L).patient(otherPatient).status(SupportTicketStatus.WAITING_STAFF).reason("X").build();
        when(tickets.findByStatusInOrderByUpdatedAtDesc(any())).thenReturn(List.of(answered, waiting));
        loginAs(staff);

        assertEquals(List.of(2L, 1L), service.listTickets(null).stream().map(SupportTicketResponse::id).toList());
    }

    // ---------- agent assist ----------

    @Test
    void onlyStaffCanAskForAnAiDraft() {
        openTicket(patient, SupportTicketStatus.WAITING_STAFF);
        loginAs(patient);
        assertThrows(AccessDeniedException.class, () -> service.assist(50L));
        org.mockito.Mockito.verifyNoInteractions(aiGateway);
    }

    @Test
    @SuppressWarnings("unchecked")
    void aiDraftSeesTheThreadAndTheSharedChatButNothingIsSent() {
        SupportTicket ticket = openTicket(patient, SupportTicketStatus.WAITING_STAFF);
        ticket.setAiTranscript("Bệnh nhân: lịch hẹn chưa xác nhận");
        ticket.setReason("PAYMENT_ISSUE");
        SupportMessage question = SupportMessage.builder().id(1L).ticket(ticket).sender(patient).senderRole("PATIENT")
                .content("Tôi chuyển khoản rồi mà chưa xác nhận").build();
        when(messages.findByTicket_IdOrderByCreatedAtAsc(50L)).thenReturn(List.of(question));
        when(aiGateway.assist(any())).thenReturn(new com.example.booking_clinic.dto.support.SupportAssistResult(
                "- Bệnh nhân hỏi trạng thái thanh toán", "Phòng khám đã nhận yêu cầu [kiểm tra giao dịch].",
                List.of(), false, 0, "openai/gpt-4.1-mini", 900, 60));
        loginAs(staff);

        var draft = service.assist(50L);

        ArgumentCaptor<java.util.Map<String, Object>> request = ArgumentCaptor.forClass(java.util.Map.class);
        verify(aiGateway).assist(request.capture());
        assertEquals("PAYMENT_ISSUE", request.getValue().get("reason"));
        assertEquals("Bệnh nhân: lịch hẹn chưa xác nhận", request.getValue().get("aiTranscript"));
        assertEquals(List.of(java.util.Map.of("role", "patient", "content", "Tôi chuyển khoản rồi mà chưa xác nhận")),
                request.getValue().get("messages"));
        assertTrue(draft.suggestedReply().contains("[kiểm tra giao dịch]"));
        verify(messages, never()).save(any()); // a draft, not a reply
    }

    @Test
    void staffReplyRecordsWhetherItStartedFromTheAiDraft() {
        openTicket(patient, SupportTicketStatus.WAITING_STAFF);
        loginAs(staff);
        assertTrue(service.addMessage(50L, new SupportMessageRequest("Đã kiểm tra, bạn yên tâm.", true)).aiAssisted());

        loginAs(patient); // a patient cannot mark their own message as AI-assisted
        assertEquals(false, service.addMessage(50L, new SupportMessageRequest("Cảm ơn", true)).aiAssisted());
    }
}
