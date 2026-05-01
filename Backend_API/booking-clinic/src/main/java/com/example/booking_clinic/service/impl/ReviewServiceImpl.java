package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.review.CreateReviewRequest;
import com.example.booking_clinic.dto.review.ReviewResponse;
import com.example.booking_clinic.dto.review.UpdateReviewRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Review;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.PatientRepository;
import com.example.booking_clinic.repository.ReviewRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request) {
        User currentUser = getCurrentUser();

        Patient patient = patientRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + request.appointmentId()));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new AccessDeniedException("You are not allowed to review this appointment");
        }

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Only completed appointments can be reviewed");
        }

        if (reviewRepository.existsByAppointment_Id(appointment.getId())) {
            throw new IllegalArgumentException("Review already exists for this appointment");
        }

        Review review = reviewRepository.save(
                Review.builder()
                        .appointment(appointment)
                        .doctor(appointment.getDoctor())
                        .patient(patient)
                        .rating(request.rating())
                        .comment(request.comment())
                        .build()
        );

        updateDoctorAverageRating(appointment.getDoctor());
        return toResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(Long id) {
        User currentUser = getCurrentUser();
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));

        String role = currentUser.getRole().getName().trim().toUpperCase();
        if ("ADMIN".equals(role)) {
            return toResponse(review);
        }

        if ("PATIENT".equals(role)) {
            if (!review.getPatient().getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You are not allowed to view this review");
            }
            return toResponse(review);
        }

        if ("DOCTOR".equals(role)) {
            if (!review.getDoctor().getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You are not allowed to view this review");
            }
            return toResponse(review);
        }

        throw new AccessDeniedException("Invalid role for viewing review");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByDoctor(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        return reviewRepository.findByDoctor_Id(doctorId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, UpdateReviewRequest request) {
        User currentUser = getCurrentUser();
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));

        if (!review.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not allowed to update this review");
        }

        if (request.rating() != null) {
            review.setRating(request.rating());
        }

        if (request.comment() != null) {
            review.setComment(request.comment());
        }

        Review savedReview = reviewRepository.save(review);
        updateDoctorAverageRating(savedReview.getDoctor());
        return toResponse(savedReview);
    }

    private void updateDoctorAverageRating(Doctor doctor) {
        List<Review> reviews = reviewRepository.findByDoctor_Id(doctor.getId());

        if (reviews.isEmpty()) {
            doctor.setAverageRating(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            doctorRepository.save(doctor);
            return;
        }

        BigDecimal average = reviews.stream()
                .map(review -> BigDecimal.valueOf(review.getRating()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(reviews.size()), 2, RoundingMode.HALF_UP);

        doctor.setAverageRating(average);
        doctorRepository.save(doctor);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        return userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getAppointment().getId(),
                review.getDoctor().getId(),
                review.getDoctor().getUser().getFullName(),
                review.getPatient().getId(),
                review.getPatient().getUser().getFullName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
