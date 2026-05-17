package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.InvalidAppointmentStateException;
import com.example.booking_clinic.common.exception.PaymentAlreadyExistsException;
import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.payment.CreatePaymentRequest;
import com.example.booking_clinic.dto.payment.PaymentResponse;
import com.example.booking_clinic.dto.payment.UpdatePaymentStatusRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Payment;
import com.example.booking_clinic.entity.Prescription;
import com.example.booking_clinic.entity.MedicalRecord;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.MedicalRecordRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import com.example.booking_clinic.repository.PrescriptionRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.NotificationService;
import com.example.booking_clinic.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + request.appointmentId()));

        User currentUser = getCurrentUser();
        String role = currentUser.getRole().getName().trim().toUpperCase();

        String paymentType = request.resolvedType(); // BOOKING | PRESCRIPTION

        // ─── Quyền truy cập ────────────────────────────────────────────
        if ("PATIENT".equals(role)) {
            if (!appointment.getPatient().getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You are not allowed to pay for someone else's appointment");
            }
        } else if (!"ADMIN".equals(role)) {
            throw new AccessDeniedException("Invalid role for creating payment");
        }

        // ─── Kiểm tra trùng payment_type cho cùng appointment ─────────
        if (paymentRepository.existsByAppointment_IdAndPaymentType(appointment.getId(), paymentType)) {
            throw new PaymentAlreadyExistsException(
                    "Payment of type " + paymentType + " already exists for this appointment");
        }

        Patient patient = appointment.getPatient();
        BigDecimal amount;

        if ("BOOKING".equals(paymentType)) {
            // ── BOOKING: phí đặt lịch, appointment phải PENDING ──────────
            if (appointment.getStatus() == null ||
                    !appointment.getStatus().equals(AppointmentStatus.PENDING)) {
                throw new InvalidAppointmentStateException(
                        "Cannot create BOOKING payment. Appointment status: " + appointment.getStatus());
            }
            amount = appointment.getDoctor().getConsultationFee();
            if (amount == null) amount = BigDecimal.ZERO;

        } else if ("PRESCRIPTION".equals(paymentType)) {
            // ── PRESCRIPTION: phí thuốc, appointment phải COMPLETED ──────
            if (appointment.getStatus() == null ||
                    !appointment.getStatus().equals(AppointmentStatus.COMPLETED)) {
                throw new InvalidAppointmentStateException(
                        "Cannot create PRESCRIPTION payment. Appointment status: " + appointment.getStatus());
            }
            amount = BigDecimal.ZERO;
            Optional<MedicalRecord> recordOpt = medicalRecordRepository
                    .findByAppointment_Id(appointment.getId());
            if (recordOpt.isPresent()) {
                Optional<Prescription> prescriptionOpt = prescriptionRepository
                        .findByMedicalRecordId(recordOpt.get().getId());
                if (prescriptionOpt.isPresent() && prescriptionOpt.get().getTotalPrice() != null) {
                    amount = prescriptionOpt.get().getTotalPrice();
                }
            }
        } else {
            throw new IllegalArgumentException("Invalid payment type. Allowed: BOOKING, PRESCRIPTION");
        }

        // ─── Xác định status ban đầu ────────────────────────────────────
        // VNPay (E_WALLET) → PAID ngay; còn lại → PENDING (admin xác nhận sau)
        String method = request.paymentMethod().toUpperCase();
        String initialStatus = "E_WALLET".equals(method) ? "PAID" : "PENDING";

        Payment payment = Payment.builder()
                .appointment(appointment)
                .patient(patient)
                .amount(amount)
                .paymentMethod(method)
                .paymentType(paymentType)
                .status(initialStatus)
                .build();

        Payment saved = paymentRepository.save(payment);

        // ─── Sau khi tạo BOOKING payment → confirm appointment ─────────
        if ("BOOKING".equals(paymentType)) {
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointmentRepository.save(appointment);

            notificationService.createNotification(
                    patient.getUser(),
                    "Dat lich thanh cong",
                    "Lich kham cua ban da duoc xac nhan. Phuong thuc thanh toan: " + method,
                    "APPOINTMENT_CONFIRMED",
                    "APPOINTMENT",
                    appointment.getId()
            );
        }

        if ("PAID".equals(initialStatus)) {
            notificationService.createNotification(
                    patient.getUser(),
                    "Thanh toan thanh cong",
                    "Khoan thanh toan cua ban da duoc ghi nhan",
                    "PAYMENT_CREATED",
                    "PAYMENT",
                    saved.getId()
            );
        }

        return toResponse(saved);
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
    public List<PaymentResponse> getPaymentsByAppointmentId(Long appointmentId) {
        User currentUser = getCurrentUser();
        String role = currentUser.getRole().getName().trim().toUpperCase();

        List<Payment> payments = paymentRepository.findByAppointment_Id(appointmentId);

        if ("PATIENT".equals(role)) {
            payments.stream().findFirst().ifPresent(p -> {
                if (!p.getPatient().getUser().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException("You are not allowed to view these payments");
                }
            });
        } else if (!"ADMIN".equals(role) && !"DOCTOR".equals(role)) {
            throw new AccessDeniedException("Invalid role for viewing payments");
        }

        return payments.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public PaymentResponse updatePaymentStatus(Long id, UpdatePaymentStatusRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        String newStatus = request.status().trim().toUpperCase();

        if (!List.of("PAID", "FAILED", "CANCELLED", "PENDING").contains(newStatus)) {
            throw new IllegalArgumentException(
                    "Invalid status. Allowed: PAID, FAILED, CANCELLED, PENDING");
        }

        payment.setStatus(newStatus);
        Payment saved = paymentRepository.save(payment);

        Appointment appointment = payment.getAppointment();

        // BOOKING payment → PAID : xác nhận appointment
        if ("PAID".equals(newStatus) && "BOOKING".equals(payment.getPaymentType())) {
            if (appointment.getStatus() == AppointmentStatus.PENDING) {
                appointment.setStatus(AppointmentStatus.CONFIRMED);
                appointmentRepository.save(appointment);
            }
            notificationService.createNotification(
                    payment.getPatient().getUser(),
                    "Thanh toan thanh cong",
                    "Khoan thanh toan dat lich cua ban da duoc xac nhan",
                    "PAYMENT_COMPLETED",
                    "PAYMENT",
                    saved.getId()
            );
        }

        // BOOKING payment → CANCELLED/FAILED : trả lại slot
        if (("CANCELLED".equals(newStatus) || "FAILED".equals(newStatus))
                && "BOOKING".equals(payment.getPaymentType())) {
            if (appointment.getStatus() == AppointmentStatus.PENDING
                    || appointment.getStatus() == AppointmentStatus.CONFIRMED) {
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setCancelReason("Thanh toán thất bại hoặc bị huỷ");
                appointmentRepository.save(appointment);
                if (appointment.getSchedule() != null) {
                    doctorScheduleRepository.releaseSchedule(appointment.getSchedule().getId());
                }
            }
        }

        if ("PAID".equals(newStatus) && "PRESCRIPTION".equals(payment.getPaymentType())) {
            notificationService.createNotification(
                    payment.getPatient().getUser(),
                    "Thanh toan don thuoc thanh cong",
                    "Khoan thanh toan don thuoc cua ban da duoc xac nhan",
                    "PAYMENT_COMPLETED",
                    "PAYMENT",
                    saved.getId()
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        User currentUser = getCurrentUser();
        String role = currentUser.getRole().getName().trim().toUpperCase();
        if (!"ADMIN".equals(role)) {
            throw new AccessDeniedException("Only ADMIN can view all payments");
        }
        return paymentRepository.findAll().stream().map(this::toResponse).toList();
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getAppointment().getId(),
                payment.getPatient().getId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentType(),
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
