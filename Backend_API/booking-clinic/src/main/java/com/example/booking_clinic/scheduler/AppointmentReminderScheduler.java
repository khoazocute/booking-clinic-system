package com.example.booking_clinic.scheduler;

import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.service.EmailService;
import com.example.booking_clinic.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Patient engagement around a visit:
 * <ul>
 *   <li>a reminder about 24 hours before the visit (confirmed, or paid and waiting for the doctor),</li>
 *   <li>a follow-up a few hours after the visit is completed: thanks, where to find the record, review link.</li>
 * </ul>
 * Always an in-app notification; also an email when SMTP is configured. Each is sent once
 * (reminderSentAt / followUpSentAt), even if the email fails, so a mail outage never causes spam.
 */
@Slf4j
@Component
public class AppointmentReminderScheduler {

    static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int BATCH = 200;

    private final AppointmentRepository appointments;
    private final NotificationService notifications;
    private final EmailService email;
    private final String appBaseUrl;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public AppointmentReminderScheduler(AppointmentRepository appointments, NotificationService notifications,
                                        EmailService email,
                                        @Value("${APP_BASE_URL:http://localhost:5173}") String appBaseUrl) {
        this(appointments, notifications, email, appBaseUrl, Clock.system(APP_ZONE));
    }

    AppointmentReminderScheduler(AppointmentRepository appointments, NotificationService notifications,
                                 EmailService email, String appBaseUrl, Clock clock) {
        this.appointments = appointments;
        this.notifications = notifications;
        this.email = email;
        this.appBaseUrl = appBaseUrl.replaceAll("/+$", "");
        this.clock = clock;
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 600_000)
    @Transactional
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        List<Appointment> due = appointments.findReminderCandidates(
                        List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING), today, today.plusDays(1))
                .stream()
                // PENDING with a payment deadline = not paid yet: no reminder for a booking that may expire
                .filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED || a.getPaymentDeadline() == null)
                .filter(a -> {
                    LocalDateTime start = startOf(a.getSchedule());
                    return start != null && start.isAfter(now) && !start.isAfter(now.plusHours(24));
                })
                .limit(BATCH)
                .toList();

        for (Appointment a : due) {
            DoctorSchedule s = a.getSchedule();
            User patient = a.getPatient().getUser();
            String when = s.getStartTime().format(TIME) + " ngày " + s.getWorkDate().format(DATE);
            String doctor = "BS. " + a.getDoctor().getUser().getFullName();
            String room = a.getDoctor().getClinicRoom() == null ? "" : ", phòng " + a.getDoctor().getClinicRoom();
            String pending = a.getStatus() == AppointmentStatus.PENDING ? " Lịch đang chờ bác sĩ xác nhận." : "";

            notifications.createNotification(patient, "Nhắc lịch khám",
                    "Bạn có lịch khám với " + doctor + " lúc " + when + room + "." + pending,
                    "APPOINTMENT_REMINDER", "APPOINTMENT", a.getId());
            email.sendEmail(patient.getEmail(), "Nhắc lịch khám lúc " + when,
                    "Chào " + patient.getFullName() + ",\n\n"
                            + "Bạn có lịch khám với " + doctor + " lúc " + when + room + "." + pending + "\n\n"
                            + "Vui lòng đến trước 15 phút và mang theo giấy tờ tuỳ thân, kết quả xét nghiệm cũ (nếu có).\n"
                            + "Xem chi tiết hoặc huỷ lịch: " + appBaseUrl + "/my-appointments/" + a.getId() + "\n\n"
                            + "Booking Clinic");
            a.setReminderSentAt(now);
        }
        if (!due.isEmpty()) {
            appointments.saveAll(due);
            log.info("Sent {} appointment reminders", due.size());
        }
    }

    @Scheduled(initialDelay = 90_000, fixedDelay = 600_000)
    @Transactional
    public void sendFollowUps() {
        LocalDateTime now = LocalDateTime.now(clock);
        // a couple of hours after the visit, and never for visits older than 3 days (e.g. first deploy)
        List<Appointment> done = appointments.findFollowUpCandidates(
                AppointmentStatus.COMPLETED, now.minusDays(3), now.minusHours(2)).stream().limit(BATCH).toList();

        for (Appointment a : done) {
            User patient = a.getPatient().getUser();
            String doctor = "BS. " + a.getDoctor().getUser().getFullName();
            notifications.createNotification(patient, "Cảm ơn bạn đã đến khám",
                    "Hồ sơ bệnh án và đơn thuốc (nếu có) đã có trong tài khoản. Hãy đánh giá buổi khám với " + doctor + ".",
                    "APPOINTMENT_FOLLOW_UP", "APPOINTMENT", a.getId());
            email.sendEmail(patient.getEmail(), "Cảm ơn bạn đã khám tại Booking Clinic",
                    "Chào " + patient.getFullName() + ",\n\n"
                            + "Cảm ơn bạn đã đến khám với " + doctor + ". Hồ sơ bệnh án và đơn thuốc (nếu có) đã được cập nhật "
                            + "trong tài khoản của bạn: " + appBaseUrl + "/my-appointments/" + a.getId() + "\n\n"
                            + "Đánh giá buổi khám (1 phút): " + appBaseUrl + "/reviews/create/" + a.getId() + "\n\n"
                            + "Nếu triệu chứng nặng hơn hoặc có dấu hiệu bất thường, hãy liên hệ phòng khám hoặc gọi 115.\n\n"
                            + "Booking Clinic");
            a.setFollowUpSentAt(now);
        }
        if (!done.isEmpty()) {
            appointments.saveAll(done);
            log.info("Sent {} after-visit follow-ups", done.size());
        }
    }

    private static LocalDateTime startOf(DoctorSchedule schedule) {
        if (schedule == null || schedule.getWorkDate() == null || schedule.getStartTime() == null) {
            return null;
        }
        return schedule.getWorkDate().atTime(schedule.getStartTime());
    }
}
