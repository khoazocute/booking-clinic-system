package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;

public interface AiConsultationService {
    AiConsultResponse consult(AiConsultRequest request);
}