package com.example.booking_clinic.scheduler;

import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Payment;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentExpiryScheduler {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final PaymentRepository paymentRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void cancelExpiredPendingAppointments() {
        List<Appointment> expired = appointmentRepository.findExpiredPendingAppointments(
                AppointmentStatus.PENDING, LocalDateTime.now(APP_ZONE));

        if (expired.isEmpty()) return;

        log.info("Cancelling {} expired PENDING appointments", expired.size());

        for (Appointment appointment : expired) {
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointment.setCancelReason("Tự động huỷ: hết thời gian thanh toán (10 phút)");

            DoctorSchedule schedule = appointment.getSchedule();
            if (schedule != null) {
                doctorScheduleRepository.releaseSchedule(schedule.getId());
            }

            // Huỷ các payment PENDING chưa được xác nhận
            List<Payment> pendingPayments = paymentRepository.findByAppointment_Id(appointment.getId());
            pendingPayments.stream()
                    .filter(p -> "PENDING".equals(p.getStatus()))
                    .forEach(p -> {
                        p.setStatus("CANCELLED");
                        paymentRepository.save(p);
                    });
        }

        appointmentRepository.saveAll(expired);
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void cancelPastAppointmentsAndSchedules() {
        LocalDate today = LocalDate.now(APP_ZONE);

        List<Appointment> pastAppointments = appointmentRepository.findPastActiveAppointments(
                List.of(
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED,
                        AppointmentStatus.REQUESTED,
                        AppointmentStatus.SCHEDULED
                ),
                today
        );

        if (!pastAppointments.isEmpty()) {
            log.info("Cancelling {} past active appointments", pastAppointments.size());
            for (Appointment appointment : pastAppointments) {
                appointment.setStatus(AppointmentStatus.CANCELLED);
                appointment.setCancelReason("Tự động huỷ: lịch khám đã qua ngày");

                DoctorSchedule schedule = appointment.getSchedule();
                if (schedule != null) {
                    schedule.setStatus("CANCELLED");
                    doctorScheduleRepository.save(schedule);
                }

                paymentRepository.findByAppointment_Id(appointment.getId()).stream()
                        .filter(p -> "PENDING".equals(p.getStatus()))
                        .forEach(p -> {
                            p.setStatus("CANCELLED");
                            paymentRepository.save(p);
                        });
            }
            appointmentRepository.saveAll(pastAppointments);
        }

        List<DoctorSchedule> pastSchedules = doctorScheduleRepository.findByWorkDateBeforeAndStatusIn(
                today,
                List.of("AVAILABLE", "BOOKED")
        );

        if (!pastSchedules.isEmpty()) {
            log.info("Cancelling {} past doctor schedules", pastSchedules.size());
            pastSchedules.forEach(schedule -> schedule.setStatus("CANCELLED"));
            doctorScheduleRepository.saveAll(pastSchedules);
        }
    }
}
