package com.example.booking_clinic.scheduler;

import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.service.EmailService;
import com.example.booking_clinic.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AppointmentReminderSchedulerTest {

    // 2026-11-26 09:00 in Vietnam
    private static final Clock CLOCK = Clock.fixed(java.time.Instant.parse("2026-11-26T02:00:00Z"),
            AppointmentReminderScheduler.APP_ZONE);
    private static final LocalDateTime NOW = LocalDateTime.now(CLOCK);

    private AppointmentRepository appointments;
    private NotificationService notifications;
    private EmailService email;
    private AppointmentReminderScheduler scheduler;
    private final User patient = User.builder().id(1L).fullName("Nguyễn Văn A").email("a@example.test").build();
    private final Doctor doctor = Doctor.builder().id(2L).clinicRoom("P303")
            .user(User.builder().id(3L).fullName("Trần Minh Khang").build()).build();

    @BeforeEach
    void setUp() {
        appointments = mock(AppointmentRepository.class);
        notifications = mock(NotificationService.class);
        email = mock(EmailService.class);
        scheduler = new AppointmentReminderScheduler(appointments, notifications, email, "https://clinic.example/", CLOCK);
    }

    private Appointment visit(long id, AppointmentStatus status, LocalDateTime start, LocalDateTime paymentDeadline) {
        return Appointment.builder().id(id).status(status).paymentDeadline(paymentDeadline)
                .patient(Patient.builder().id(10L).user(patient).build()).doctor(doctor)
                .schedule(DoctorSchedule.builder().id(id * 10).workDate(start.toLocalDate())
                        .startTime(LocalTime.of(start.getHour(), start.getMinute())).build())
                .build();
    }

    @Test
    void remindsVisitsInTheNext24HoursOnce() {
        Appointment tomorrowMorning = visit(1, AppointmentStatus.CONFIRMED, NOW.plusHours(23), null);
        Appointment paidAwaitingDoctor = visit(2, AppointmentStatus.PENDING, NOW.plusHours(5), null);
        Appointment tooFar = visit(3, AppointmentStatus.CONFIRMED, NOW.plusHours(30), null);
        Appointment unpaid = visit(4, AppointmentStatus.PENDING, NOW.plusHours(5), NOW.plusMinutes(5));
        Appointment alreadyStarted = visit(5, AppointmentStatus.CONFIRMED, NOW.minusMinutes(30), null);
        when(appointments.findReminderCandidates(any(), any(), any()))
                .thenReturn(List.of(tomorrowMorning, paidAwaitingDoctor, tooFar, unpaid, alreadyStarted));

        scheduler.sendReminders();

        assertNotNull(tomorrowMorning.getReminderSentAt());
        assertNotNull(paidAwaitingDoctor.getReminderSentAt());
        assertNull(tooFar.getReminderSentAt());
        assertNull(unpaid.getReminderSentAt());
        assertNull(alreadyStarted.getReminderSentAt());
        verify(notifications).createNotification(eq(patient), eq("Nhắc lịch khám"), contains("P303"),
                eq("APPOINTMENT_REMINDER"), eq("APPOINTMENT"), eq(1L));
        verify(email).sendEmail(eq("a@example.test"), anyString(), contains("https://clinic.example/my-appointments/1"));
    }

    @Test
    void aFailedEmailStillCountsAsSentSoAMailOutageNeverCausesSpam() {
        Appointment visit = visit(1, AppointmentStatus.CONFIRMED, NOW.plusHours(3), null);
        when(appointments.findReminderCandidates(any(), any(), any())).thenReturn(List.of(visit));
        when(email.sendEmail(anyString(), anyString(), anyString())).thenReturn(false);

        scheduler.sendReminders();

        assertEquals(NOW, visit.getReminderSentAt());
        verify(notifications).createNotification(any(), anyString(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void followUpAfterTheVisitLinksToTheReview() {
        Appointment done = visit(7, AppointmentStatus.COMPLETED, NOW.minusHours(5), null);
        when(appointments.findFollowUpCandidates(eq(AppointmentStatus.COMPLETED), any(), any())).thenReturn(List.of(done));

        scheduler.sendFollowUps();

        assertNotNull(done.getFollowUpSentAt());
        verify(email).sendEmail(eq("a@example.test"), anyString(), contains("https://clinic.example/reviews/create/7"));
        verify(appointments).findFollowUpCandidates(AppointmentStatus.COMPLETED, NOW.minusDays(3), NOW.minusHours(2));
    }

    @Test
    void nothingDueMeansNoWrites() {
        when(appointments.findReminderCandidates(any(), any(), any())).thenReturn(List.of());
        scheduler.sendReminders();
        verify(appointments, never()).saveAll(any());
    }
}
