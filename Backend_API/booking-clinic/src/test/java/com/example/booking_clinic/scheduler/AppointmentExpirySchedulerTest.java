package com.example.booking_clinic.scheduler;

import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Payment;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Regression: a PENDING appointment whose booking payment was submitted must not be auto-cancelled. */
class AppointmentExpirySchedulerTest {

    private AppointmentRepository appointments;
    private DoctorScheduleRepository schedules;
    private PaymentRepository payments;
    private AppointmentExpiryScheduler scheduler;

    @BeforeEach
    void setUp() {
        appointments = mock(AppointmentRepository.class);
        schedules = mock(DoctorScheduleRepository.class);
        payments = mock(PaymentRepository.class);
        scheduler = new AppointmentExpiryScheduler(appointments, schedules, payments);
    }

    private static Appointment expired(long id) {
        return Appointment.builder()
                .id(id)
                .status(AppointmentStatus.PENDING)
                .paymentDeadline(LocalDateTime.now().minusMinutes(1))
                .schedule(DoctorSchedule.builder().id(id * 10).build())
                .build();
    }

    private static Payment booking(String method, String status) {
        return Payment.builder().paymentType("BOOKING").paymentMethod(method).status(status).build();
    }

    @Test
    void cancelsUnpaidAppointmentAndReleasesTheSlot() {
        Appointment unpaid = expired(1);
        when(appointments.findExpiredPendingAppointments(eq(AppointmentStatus.PENDING), any())).thenReturn(List.of(unpaid));
        when(payments.findByAppointment_Id(1L)).thenReturn(List.of());

        scheduler.cancelExpiredPendingAppointments();

        assertEquals(AppointmentStatus.CANCELLED, unpaid.getStatus());
        verify(schedules).releaseSchedule(10L);
    }

    @Test
    void keepsAppointmentPaidByVnpay() {
        Appointment paid = expired(2);
        when(appointments.findExpiredPendingAppointments(eq(AppointmentStatus.PENDING), any())).thenReturn(List.of(paid));
        when(payments.findByAppointment_Id(2L)).thenReturn(List.of(booking("E_WALLET", "PAID")));

        scheduler.cancelExpiredPendingAppointments();

        assertEquals(AppointmentStatus.PENDING, paid.getStatus());
        assertNull(paid.getPaymentDeadline());
        verify(schedules, never()).releaseSchedule(any());
    }

    @Test
    void keepsAppointmentWithCashPaymentAwaitingConfirmation() {
        Appointment cash = expired(3);
        Payment pending = booking("CASH", "PENDING");
        when(appointments.findExpiredPendingAppointments(eq(AppointmentStatus.PENDING), any())).thenReturn(List.of(cash));
        when(payments.findByAppointment_Id(3L)).thenReturn(List.of(pending));

        scheduler.cancelExpiredPendingAppointments();

        assertEquals(AppointmentStatus.PENDING, cash.getStatus());
        assertEquals("PENDING", pending.getStatus()); // not cancelled either
    }

    @Test
    void failedPaymentDoesNotProtectTheAppointment() {
        Appointment failed = expired(4);
        when(appointments.findExpiredPendingAppointments(eq(AppointmentStatus.PENDING), any())).thenReturn(List.of(failed));
        when(payments.findByAppointment_Id(4L)).thenReturn(List.of(booking("E_WALLET", "FAILED")));

        scheduler.cancelExpiredPendingAppointments();

        assertEquals(AppointmentStatus.CANCELLED, failed.getStatus());
    }
}
