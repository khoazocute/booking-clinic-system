package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.review.CreateReviewRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Review;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.PatientRepository;
import com.example.booking_clinic.repository.ReviewRepository;
import com.example.booking_clinic.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User currentUser;
    private User doctorUser;
    private Patient patient;
    private Doctor doctor;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        Role role = Role.builder()
                .id(3L)
                .name("PATIENT")
                .build();

        currentUser = User.builder()
                .id(1L)
                .email("patient1@gmail.com")
                .fullName("Patient One")
                .role(role)
                .build();

        patient = Patient.builder()
                .id(10L)
                .user(currentUser)
                .build();

        doctorUser = User.builder()
                .id(2L)
                .email("doctor1@gmail.com")
                .fullName("Doctor One")
                .build();

        doctor = Doctor.builder()
                .id(20L)
                .user(doctorUser)
                .averageRating(BigDecimal.ZERO)
                .build();

        appointment = Appointment.builder()
                .id(100L)
                .patient(patient)
                .doctor(doctor)
                .status(AppointmentStatus.COMPLETED)
                .build();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(currentUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createReview_shouldSuccess_whenAppointmentCompletedAndOwnedByPatient() {
        CreateReviewRequest request = new CreateReviewRequest(100L, 5, "Bac si rat tot");

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(patientRepository.findByUser_Id(currentUser.getId())).thenReturn(Optional.of(patient));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(reviewRepository.existsByAppointment_Id(100L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            review.setId(1L);
            return review;
        });
        when(reviewRepository.findByDoctor_Id(doctor.getId())).thenReturn(List.of(
                Review.builder()
                        .id(1L)
                        .appointment(appointment)
                        .doctor(doctor)
                        .patient(patient)
                        .rating(5)
                        .comment("Bac si rat tot")
                        .build()
        ));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = reviewService.createReview(request);

        assertEquals(1L, response.id());
        assertEquals(100L, response.appointmentId());
        assertEquals(5, response.rating());
        assertEquals("Bac si rat tot", response.comment());
    }

    @Test
    void createReview_shouldThrow_whenAppointmentNotCompleted() {
        appointment.setStatus(AppointmentStatus.PENDING);
        CreateReviewRequest request = new CreateReviewRequest(100L, 5, "Good");

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(patientRepository.findByUser_Id(currentUser.getId())).thenReturn(Optional.of(patient));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        assertThrows(IllegalArgumentException.class, () -> reviewService.createReview(request));
    }

    @Test
    void createReview_shouldThrow_whenReviewAlreadyExists() {
        CreateReviewRequest request = new CreateReviewRequest(100L, 5, "Good");

        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
        when(patientRepository.findByUser_Id(currentUser.getId())).thenReturn(Optional.of(patient));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(reviewRepository.existsByAppointment_Id(100L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> reviewService.createReview(request));
    }
}
