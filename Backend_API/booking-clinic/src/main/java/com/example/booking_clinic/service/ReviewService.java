package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.review.CreateReviewRequest;
import com.example.booking_clinic.dto.review.ReviewResponse;
import com.example.booking_clinic.dto.review.UpdateReviewRequest;

import java.util.List;

public interface ReviewService {
    ReviewResponse createReview(CreateReviewRequest request);

    ReviewResponse getReviewById(Long id);

    List<ReviewResponse> getReviewsByDoctor(Long doctorId);

    ReviewResponse updateReview(Long id, UpdateReviewRequest request);
}
