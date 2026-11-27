package com.example.booking_clinic.booking;

import com.example.booking_clinic.common.exception.ResourceConflictException;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.service.impl.DoctorScheduleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Regression: deleting a slot that had appointments failed with a foreign-key error (HTTP 500). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ScheduleDeletionTest {

    @Mock DoctorScheduleRepository schedules;
    @Mock AppointmentRepository appointments;
    @InjectMocks DoctorScheduleServiceImpl service;

    private DoctorSchedule slot;

    @BeforeEach
    void setUp() {
        slot = DoctorSchedule.builder().id(5L).status("AVAILABLE").build();
        when(schedules.findByIdWithLock(5L)).thenReturn(Optional.of(slot));
    }

    @Test
    void aSlotHeldByAnActiveAppointmentCannotBeDeleted() {
        when(appointments.existsBySchedule_IdAndStatusIn(eq(5L), anyList())).thenReturn(true);

        assertThrows(ResourceConflictException.class, () -> service.deleteSchedule(5L));
        verify(schedules, never()).delete(any());
    }

    @Test
    void aSlotWithPastAppointmentsIsClosedNotDeleted() {
        when(appointments.existsBySchedule_Id(5L)).thenReturn(true);

        service.deleteSchedule(5L);

        assertEquals("CANCELLED", slot.getStatus());
        verify(schedules, never()).delete(any());
    }

    @Test
    void anUnusedSlotIsDeleted() {
        service.deleteSchedule(5L);
        verify(schedules).delete(slot);
    }
}
