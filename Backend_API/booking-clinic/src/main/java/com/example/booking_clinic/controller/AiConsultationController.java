package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.ai.AiConsultRequest;
import com.example.booking_clinic.dto.ai.AiConsultResponse;
import com.example.booking_clinic.service.AiConsultationService;
import com.example.booking_clinic.service.AiKnowledgeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiConsultationController {

    private final AiKnowledgeService aiKnowledgeService;
    private final AiConsultationService aiConsultationService;

    @PostMapping("/rebuild-index")
    public ResponseEntity<ApiResponse<Integer>> rebuildIndex() {
        int count = aiKnowledgeService.rebuildIndex();
        return ResponseEntity.ok(ApiResponse.success("AI index rebuilt successfully", count));
    }

    @PostMapping("/consult")
    public ResponseEntity<ApiResponse<AiConsultResponse>> consult(
            @Valid @RequestBody AiConsultRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success("AI consultation completed", aiConsultationService.consult(request)));
    }
}