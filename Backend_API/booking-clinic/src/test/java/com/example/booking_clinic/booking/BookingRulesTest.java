package com.example.booking_clinic.booking;

import com.example.booking_clinic.common.exception.SlotUnavailableException;
import com.example.booking_clinic.dto.appointment.CreateAppointmentRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.PatientRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.NotificationService;
import com.example.booking_clinic.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The booking rules, one at a time (the concurrency itself is covered by BookingConcurrency*Test). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingRulesTest {

    @Mock AppointmentRepository appointments;
    @Mock PatientRepository patients;
    @Mock DoctorScheduleRepository schedules;
    @Mock UserRepository users;
    @Mock NotificationService notifications;
    @InjectMocks AppointmentServiceImpl service;

    private final User user = User.builder().id(1L).email("p@example.test").fullName("P").build();
    private final Patient patient = Patient.builder().id(10L).user(user).build();
    private DoctorSchedule slot;

    @BeforeEach
    void setUp() {
        Doctor doctor = Doctor.builder().id(2L).status("ACTIVE").licenseStatus("ACTIVE")
                .consultationFee(new BigDecimal("300000")).user(User.builder().id(3L).fullName("BS").build()).build();
        slot = DoctorSchedule.builder().id(5L).doctor(doctor).workDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(9, 30)).status("AVAILABLE").build();

        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
        when(users.findByEmail("p@example.test")).thenReturn(Optional.of(user));
        when(patients.findByUser_Id(1L)).thenReturn(Optional.of(patient));
        when(schedules.findByIdWithLock(5L)).thenReturn(Optional.of(slot));
        when(appointments.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(100L);
            return a;
        });
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void readsTheSlotWithARowLockAndBooksIt() {
        service.createAppointment(new CreateAppointmentRequest(5L, "đau họng"));

        verify(schedules).findByIdWithLock(5L);
        verify(schedules, never()).findById(anyLong()); // an unlocked read is exactly the race condition
        assertEquals("BOOKED", slot.getStatus());

        ArgumentCaptor<Appointment> saved = ArgumentCaptor.forClass(Appointment.class);
        verify(appointments).save(saved.capture());
        assertEquals(AppointmentStatus.PENDING, saved.getValue().getStatus());
        assertNotNull(saved.getValue().getPaymentDeadline()); // 10-minute hold
    }

    @Test
    void slotAlreadyTakenIs409AndNothingIsWritten() {
        slot.setStatus("BOOKED");

        SlotUnavailableException error = assertThrows(SlotUnavailableException.class,
                () -> service.createAppointment(new CreateAppointmentRequest(5L, null)));

        assertEquals("Khung giờ này vừa có người đặt. Vui lòng chọn khung giờ khác.", error.getMessage());
        verify(appointments, never()).save(any());
        verify(schedules, never()).save(any());
    }

    @Test
    void aPatientCannotHoldTwoAppointmentsAtTheSameTimeEvenWithDifferentDoctors() {
        when(appointments.existsOverlappingForPatient(any(), any(), any(), any(), any())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.createAppointment(new CreateAppointmentRequest(5L, null)));
        assertEquals("AVAILABLE", slot.getStatus()); // nothing changed
        verify(appointments).existsOverlappingForPatient(10L, List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED,
                AppointmentStatus.REQUESTED, AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS),
                slot.getWorkDate(), LocalTime.of(9, 0), LocalTime.of(9, 30));
    }

    @Test
    void pastSlotsCannotBeBooked() {
        slot.setWorkDate(LocalDate.now().minusDays(1));
        assertThrows(IllegalArgumentException.class, () -> service.createAppointment(new CreateAppointmentRequest(5L, null)));
        verify(appointments, never()).save(any());
    }

    @Test
    void doctorWithAnExpiredLicenseCannotBeBooked() {
        slot.getDoctor().setLicenseExpiryDate(LocalDate.now().minusDays(1));
        assertThrows(IllegalArgumentException.class, () -> service.createAppointment(new CreateAppointmentRequest(5L, null)));
        assertEquals("AVAILABLE", slot.getStatus());
    }
}
