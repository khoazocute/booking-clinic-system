package com.example.booking_clinic.dto.support;

import com.example.booking_clinic.dto.ai.AiChatMessage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * @param transcript the AI conversation, sent only if the patient ticked "share my chat with staff"
 */
public record CreateSupportTicketRequest(
        @NotBlank(message = "Vui lòng nhập nội dung cần hỗ trợ")
        @Size(max = 2000, message = "Nội dung tối đa 2000 ký tự")
        String message,

        @Size(max = 30)
        String reason,

        @Valid
        @Size(max = 20, message = "Tối đa 20 tin nhắn trò chuyện")
        List<AiChatMessage> transcript
) {
}
