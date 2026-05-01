package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.review.CreateReviewRequest;
import com.example.booking_clinic.dto.review.ReviewResponse;
import com.example.booking_clinic.dto.review.UpdateReviewRequest;
import com.example.booking_clinic.service.ReviewService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review created successfully", reviewService.createReview(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Review fetched successfully", reviewService.getReviewById(id))
        );
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(
                ApiResponse.success("Reviews fetched successfully", reviewService.getReviewsByDoctor(doctorId))
        );
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Review updated successfully", reviewService.updateReview(id, request))
        );
    }
}
