package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceConflictException;
import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.doctor_schedule.CreateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.DoctorScheduleResponse;
import com.example.booking_clinic.dto.doctor_schedule.UpdateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.UpdateStatusDoctorScheduleRequest;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.service.DoctorScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    //Validate dữ liệu
    private void validateScheduleTime(LocalDate workDate, LocalTime startTime, LocalTime endTime) {
        LocalDate today = LocalDate.now(APP_ZONE);

        if (workDate.isBefore(today)) {
            throw new IllegalArgumentException("Work date cannot be in the past");
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        if (workDate.isEqual(today) && !startTime.isAfter(LocalTime.now(APP_ZONE))) {
            throw new IllegalArgumentException("Start time must be in the future for today's schedule");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getSchedulesByDoctor(Long doctorId, LocalDate workDate) {
        List<DoctorSchedule> schedules;
        if (workDate != null) {
            schedules = scheduleRepository.findByDoctor_IdAndWorkDateOrderByCreatedAtDescIdDesc(doctorId, workDate);
        } else {
            schedules = scheduleRepository.findByDoctor_IdOrderByCreatedAtDescIdDesc(doctorId);
        }

        return schedules.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(CreateDoctorScheduleRequest request) {
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        validateScheduleTime(request.workDate(), request.startTime(), request.endTime());

        if (!"ACTIVE".equalsIgnoreCase(doctor.getStatus())) {
            throw new IllegalArgumentException("Cannot create schedule for an inactive doctor");
        }

        if (scheduleRepository.existsOverlappingSchedule(
                request.doctorId(), request.workDate(), request.startTime(), request.endTime())) {
            throw new IllegalArgumentException("Schedule overlaps with an existing schedule for this doctor on the selected date");
        }

        DoctorSchedule schedule = DoctorSchedule.builder()
                .doctor(doctor)
                .workDate(request.workDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .status("AVAILABLE")
                .build();

        return toResponse(scheduleRepository.save(schedule));
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateSchedule(Long id, UpdateDoctorScheduleRequest request) {
        DoctorSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        validateScheduleTime(request.workDate(), request.startTime(), request.endTime());

        if (!"ACTIVE".equalsIgnoreCase(doctor.getStatus())) {
            throw new IllegalArgumentException("Cannot update schedule for an inactive doctor");
        }

        if (scheduleRepository.existsOverlappingScheduleExcluding(
                request.doctorId(), id, request.workDate(), request.startTime(), request.endTime())) {
            throw new IllegalArgumentException("Schedule overlaps with an existing schedule for this doctor on the selected date");
        }

        schedule.setDoctor(doctor);
        schedule.setWorkDate(request.workDate());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());

        return toResponse(scheduleRepository.save(schedule));
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        // same row lock as booking: a delete and a booking of this slot cannot interleave
        DoctorSchedule schedule = scheduleRepository.findByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        if (appointmentRepository.existsBySchedule_IdAndStatusIn(id, List.of(AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED, AppointmentStatus.SCHEDULED,
                AppointmentStatus.IN_PROGRESS))) {
            throw new ResourceConflictException("Khung giờ đang có lịch hẹn. Hãy huỷ lịch hẹn trước khi xoá khung giờ.");
        }
        if (appointmentRepository.existsBySchedule_Id(id)) {
            // past (cancelled / completed) visits still point here: keep the history, just close the slot
            schedule.setStatus("CANCELLED");
            scheduleRepository.save(schedule);
            return;
        }
        scheduleRepository.delete(schedule);
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateScheduleStatus(Long id, UpdateStatusDoctorScheduleRequest request) {
        DoctorSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        schedule.setStatus(request.status().trim().toUpperCase());
        return toResponse(scheduleRepository.save(schedule));
    }

    private DoctorScheduleResponse toResponse(DoctorSchedule schedule) {
        return new DoctorScheduleResponse(
                schedule.getId(),
                schedule.getDoctor().getId(),
                schedule.getWorkDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getStatus()
        );
    }
}
