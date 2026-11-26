package com.example.booking_clinic.dto.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportMessageRequest(
        @NotBlank(message = "Tin nhắn không được để trống")
        @Size(max = 2000, message = "Tin nhắn tối đa 2000 ký tự")
        String content,

        /** staff only: the reply started from the AI draft */
        Boolean aiAssisted
) {
    public SupportMessageRequest(String content) {
        this(content, null);
    }
}
