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

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentExpiryScheduler {

    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final PaymentRepository paymentRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void cancelExpiredPendingAppointments() {
        List<Appointment> expired = appointmentRepository.findExpiredPendingAppointments(
                AppointmentStatus.PENDING, LocalDateTime.now());

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
}
