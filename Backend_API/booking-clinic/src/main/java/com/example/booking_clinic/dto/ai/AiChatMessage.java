package com.example.booking_clinic.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Only "user" and "assistant" roles are accepted from the client: no system / tool injection. */
public record AiChatMessage(
        @NotBlank @Pattern(regexp = "user|assistant", message = "role must be user or assistant")
        String role,
        @NotBlank @Size(max = 2000, message = "message is too long (max 2000 characters)")
        String content
) {
}
