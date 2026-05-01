package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.common.exception.InvalidAppointmentStateException;
import com.example.booking_clinic.common.exception.PaymentAlreadyExistsException;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.booking_clinic.dto.payment.CreatePaymentRequest;
import com.example.booking_clinic.dto.payment.UpdatePaymentStatusRequest;
import com.example.booking_clinic.dto.payment.PaymentResponse;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Payment;
import com.example.booking_clinic.entity.MedicalRecord;
import com.example.booking_clinic.entity.Prescription;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.MedicalRecordRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import com.example.booking_clinic.repository.PrescriptionRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

        private final PaymentRepository paymentRepository;
        private final AppointmentRepository appointmentRepository;
        private final MedicalRecordRepository medicalRecordRepository;
        private final PrescriptionRepository prescriptionRepository;
        private final UserRepository userRepository;

        @Override
        @Transactional
        public PaymentResponse createPayment(CreatePaymentRequest request) {
                Appointment appointment = appointmentRepository.findById(request.appointmentId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Appointment not found with id: " + request.appointmentId()));

                if (paymentRepository.existsByAppointment_Id(appointment.getId())) {
                        throw new PaymentAlreadyExistsException("Payment already exists for this appointment");
                }

                if (appointment.getStatus() == null || !appointment.getStatus().equals(AppointmentStatus.COMPLETED)) {
                        throw new InvalidAppointmentStateException(
                                        "Appointment must be completed before payment. Current status: "
                                                        + appointment.getStatus());
                }

                User currentUser = getCurrentUser();
                String role = currentUser.getRole().getName().trim().toUpperCase();

                if ("PATIENT".equals(role)) {
                        if (!appointment.getPatient().getUser().getId().equals(currentUser.getId())) {
                                throw new AccessDeniedException(
                                                "You are not allowed to pay for someone else's appointment");
                        }
                } else if (!"ADMIN".equals(role)) {
                        throw new AccessDeniedException("Invalid role for creating payment");
                }

                Patient patient = appointment.getPatient();

                java.math.BigDecimal totalAmount = appointment.getDoctor().getConsultationFee();
                if (totalAmount == null) {
                        totalAmount = java.math.BigDecimal.ZERO;
                }

                java.util.Optional<MedicalRecord> medicalRecordOpt = medicalRecordRepository
                                .findByAppointment_Id(appointment.getId());
                if (medicalRecordOpt.isPresent()) {
                        java.util.Optional<Prescription> prescriptionOpt = prescriptionRepository
                                        .findByMedicalRecordId(medicalRecordOpt.get().getId());
                        if (prescriptionOpt.isPresent() && prescriptionOpt.get().getTotalPrice() != null) {
                                totalAmount = totalAmount.add(prescriptionOpt.get().getTotalPrice());
                        }
                }

                Payment payment = Payment.builder()
                                .appointment(appointment)
                                .patient(patient)
                                .amount(totalAmount)
                                .paymentMethod(request.paymentMethod())
                                .status("PENDING")
                                .build();

                Payment savedPayment = paymentRepository.save(payment);

                return toResponse(savedPayment);
        }

        @Override
        @Transactional(readOnly = true)
        public PaymentResponse getPaymentById(Long id) {
                Payment payment = paymentRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

                User currentUser = getCurrentUser();
                String role = currentUser.getRole().getName().trim().toUpperCase();

                if ("PATIENT".equals(role)) {
                        if (!payment.getPatient().getUser().getId().equals(currentUser.getId())) {
                                throw new AccessDeniedException("You are not allowed to view this payment");
                        }
                } else if ("DOCTOR".equals(role)) {
                        if (!payment.getAppointment().getDoctor().getUser().getId().equals(currentUser.getId())) {
                                throw new AccessDeniedException("You are not allowed to view this payment");
                        }
                } else if (!"ADMIN".equals(role)) {
                        throw new AccessDeniedException("Invalid role for viewing payment");
                }

                return toResponse(payment);
        }

        @Override
        @Transactional(readOnly = true)
        public PaymentResponse getPaymentByAppointmentId(Long appointmentId) {
                Payment payment = paymentRepository.findByAppointment_Id(appointmentId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Payment not found for appointment id: " + appointmentId));

                User currentUser = getCurrentUser();
                String role = currentUser.getRole().getName().trim().toUpperCase();

                if ("PATIENT".equals(role)) {
                        if (!payment.getPatient().getUser().getId().equals(currentUser.getId())) {
                                throw new AccessDeniedException("You are not allowed to view this payment");
                        }
                } else if ("DOCTOR".equals(role)) {
                        if (!payment.getAppointment().getDoctor().getUser().getId().equals(currentUser.getId())) {
                                throw new AccessDeniedException("You are not allowed to view this payment");
                        }
                } else if (!"ADMIN".equals(role)) {
                        throw new AccessDeniedException("Invalid role for viewing payment");
                }

                return toResponse(payment);
        }

        @Override
        @Transactional
        public PaymentResponse updatePaymentStatus(Long id, UpdatePaymentStatusRequest request) {
                Payment payment = paymentRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

                String newStatus = request.status().trim().toUpperCase();

                // Validate allowed statuses
                if (!java.util.List.of("PAID", "FAILED", "CANCELLED", "PENDING").contains(newStatus)) {
                        throw new IllegalArgumentException(
                                        "Invalid status. Allowed statuses are: PAID, FAILED, CANCELLED, PENDING");
                }

                payment.setStatus(newStatus);
                Payment savedPayment = paymentRepository.save(payment);

                return toResponse(savedPayment);
        }

        private PaymentResponse toResponse(Payment payment) {
                return new PaymentResponse(
                                payment.getId(),
                                payment.getAppointment().getId(),
                                payment.getPatient().getId(),
                                payment.getAmount(),
                                payment.getPaymentMethod(),
                                payment.getStatus(),
                                payment.getCreatedAt(),
                                payment.getUpdatedAt());
        }

        private User getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                User principal = (User) authentication.getPrincipal();

                return userRepository.findByEmail(principal.getEmail())
                                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
        }
}
