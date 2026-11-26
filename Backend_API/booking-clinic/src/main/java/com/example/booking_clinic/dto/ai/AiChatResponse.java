package com.example.booking_clinic.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * One assistant turn. Structured fields are produced by the AI service's tools (never parsed from
 * model text), so the UI can render doctors, slots and the booking proposal reliably.
 *
 * @param bookingProposal a slot the patient chose; NOT booked. The UI sends the patient to the normal
 *                        booking flow, which re-validates and books it under the patient's own JWT.
 * @param degraded        true when the AI service was unavailable and the keyword fallback answered
 * @param conversationId server-side conversation (history is read from the database, not from the client)
 * @param messageId      this assistant message, for thumbs up / down feedback
 * @param handoffSuggested show the "talk to staff" button (the assistant offered it, gave up, or was unavailable);
 *                        the ticket is only created when the patient presses it
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiChatResponse(
        String answer,
        AiEmergency emergency,
        List<Citation> citations,
        List<DoctorCard> doctors,
        List<Slot> slots,
        BookingProposal bookingProposal,
        List<AiSuggestionResponse> suggestions,
        boolean degraded,
        String source,
        boolean handoffSuggested,
        String handoffReason,
        Long conversationId,
        Long messageId
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Citation(String ref, String title, String sourceType, Long sourceId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DoctorCard(Long id, String fullName, Long specialtyId, String specialtyName, Integer experienceYears,
                             String qualification, BigDecimal averageRating, BigDecimal consultationFee,
                             String clinicRoom) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Slot(Long scheduleId, Long doctorId, String workDate, String startTime, String endTime) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BookingProposal(Long scheduleId, Long doctorId, String doctorName, String specialtyName,
                                  String workDate, String startTime, String endTime, BigDecimal consultationFee,
                                  String reason) {
    }

    public AiChatResponse withSource(String newSource) {
        return new AiChatResponse(answer, emergency, nullToEmpty(citations), nullToEmpty(doctors), nullToEmpty(slots),
                bookingProposal, nullToEmpty(suggestions), degraded, newSource, handoffSuggested, handoffReason,
                conversationId, messageId);
    }

    public AiChatResponse withIds(Long newConversationId, Long newMessageId) {
        return new AiChatResponse(answer, emergency, nullToEmpty(citations), nullToEmpty(doctors), nullToEmpty(slots),
                bookingProposal, nullToEmpty(suggestions), degraded, source, handoffSuggested, handoffReason,
                newConversationId, newMessageId);
    }

    private static <T> List<T> nullToEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }
}
