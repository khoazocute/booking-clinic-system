package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.payment.CreatePaymentRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Payment;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import com.example.booking_clinic.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Regression: submitting the booking payment ends the 10-minute deadline for that appointment. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private com.example.booking_clinic.repository.MedicalRecordRepository medicalRecordRepository;
    @Mock private com.example.booking_clinic.repository.PrescriptionRepository prescriptionRepository;
    @Mock private com.example.booking_clinic.repository.DoctorScheduleRepository doctorScheduleRepository;
    @Mock private com.example.booking_clinic.service.NotificationService notificationService;
    @Mock private com.example.booking_clinic.service.MedicineService medicineService;
    @InjectMocks private PaymentServiceImpl service;

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @ValueSource(strings = {"CASH", "BANK_TRANSFER"})
    void bookingPaymentClearsThePaymentDeadline(String method) {
        User user = User.builder().id(1L).email("p@example.test").role(Role.builder().name("PATIENT").build()).build();
        Appointment appointment = Appointment.builder()
                .id(100L)
                .status(AppointmentStatus.PENDING)
                .paymentDeadline(LocalDateTime.now().plusMinutes(5))
                .patient(Patient.builder().id(10L).user(user).build())
                .doctor(Doctor.builder().id(20L).user(User.builder().id(2L).build())
                        .consultationFee(new BigDecimal("300000")).build())
                .build();

        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
        when(userRepository.findByEmail("p@example.test")).thenReturn(Optional.of(user));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPayment(new CreatePaymentRequest(100L, method, "BOOKING"));

        assertNull(appointment.getPaymentDeadline());
        verify(appointmentRepository).save(appointment);
    }

    /** Regression: a patient could POST {"paymentMethod":"E_WALLET"} and get a PAID booking without paying. */
    @Test
    void clientCannotDeclareAVnpayPaymentPaid() {
        User user = User.builder().id(1L).email("p@example.test").role(Role.builder().name("PATIENT").build()).build();
        Appointment appointment = Appointment.builder().id(100L).status(AppointmentStatus.PENDING)
                .patient(Patient.builder().id(10L).user(user).build())
                .doctor(Doctor.builder().id(20L).consultationFee(new BigDecimal("300000")).build())
                .build();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
        when(userRepository.findByEmail("p@example.test")).thenReturn(Optional.of(user));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));

        for (String method : List.of("E_WALLET", "e_wallet", "FREE")) {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createPayment(new CreatePaymentRequest(100L, method, "BOOKING")));
        }
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void verifiedVnpayPaymentIsRecordedOnceEvenIfDeliveredTwice() {
        User user = User.builder().id(1L).build();
        Patient patient = Patient.builder().id(10L).user(user).build();
        Appointment appointment = Appointment.builder().id(100L).status(AppointmentStatus.PENDING)
                .paymentDeadline(LocalDateTime.now().plusMinutes(3)).patient(patient)
                .doctor(Doctor.builder().id(20L).build()).build();
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.findByAppointment_Id(100L)).thenReturn(List.of());

        service.recordVerifiedVnpayPayment(100L, new BigDecimal("300000"), "TX1");
        assertNull(appointment.getPaymentDeadline());

        Payment recorded = Payment.builder().id(5L).appointment(appointment).patient(patient).paymentType("BOOKING")
                .paymentMethod("E_WALLET").status("PAID").transactionCode("TX1").amount(new BigDecimal("300000")).build();
        when(paymentRepository.findByAppointment_Id(100L)).thenReturn(List.of(recorded));
        service.recordVerifiedVnpayPayment(100L, new BigDecimal("300000"), "TX1"); // IPN after the browser return
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }
}
