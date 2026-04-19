package com.example.booking_clinic.dto.doctor_schedule;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoctorScheduleResponse(
        Long id,
        Long doctorId,
        LocalDate workDate,
        LocalTime startTime,
        LocalTime endTime,
        String status
) {

}
