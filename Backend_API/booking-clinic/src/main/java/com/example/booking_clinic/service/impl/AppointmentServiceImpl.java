package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.appointment.AppointmentResponse;
import com.example.booking_clinic.dto.appointment.CancelAppointmentResponse;
import com.example.booking_clinic.dto.appointment.CreateAppointmentRequest;
import com.example.booking_clinic.dto.appointment.UpdateAppointmentStatusRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Payment;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.PatientRepository;
import com.example.booking_clinic.repository.PaymentRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.AppointmentService;
import com.example.booking_clinic.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        User currentUser = getCurrentUser();

        // Tìm Patient từ userId của người đang đăng nhập
        Patient patient = patientRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient profile not found. Please complete your patient profile first."));

        // Tìm DoctorSchedule (khung giờ được chọn)
        DoctorSchedule schedule = doctorScheduleRepository.findById(request.scheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor schedule not found"));

        // Kiểm tra bệnh nhân chưa có lịch ACTIVE trên khung giờ này
        if (appointmentRepository.existsByPatient_IdAndSchedule_IdAndStatusIn(
                patient.getId(), schedule.getId(),
                List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED))) {
            throw new IllegalArgumentException("You have already booked this schedule slot");
        }

        // Atomic booking: chỉ cập nhật được nếu slot vẫn AVAILABLE tại thời điểm này
        int booked = doctorScheduleRepository.tryBookSchedule(schedule.getId());
        if (booked == 0) {
            throw new IllegalArgumentException("This schedule slot is not available for booking");
        }

        // Lấy Doctor từ schedule
        Doctor doctor = schedule.getDoctor();

        // Tạo Appointment với deadline thanh toán 10 phút
        LocalDateTime deadline = LocalDateTime.now().plusMinutes(10);
        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .schedule(schedule)
                .appointmentDate(schedule.getWorkDate())
                .reason(request.reason())
                .status(AppointmentStatus.PENDING)
                .paymentDeadline(deadline)
                .build();

        Appointment savedAppointment = appointmentRepository.save(appointment);

        notificationService.createNotification(
                patient.getUser(),
                "Dat lich thanh cong",
                "Ban da dat lich kham thanh cong voi bac si " + doctor.getUser().getFullName(),
                "APPOINTMENT_CREATED",
                "APPOINTMENT",
                savedAppointment.getId()
        );

        return toResponse(savedAppointment);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        User currentUser = getCurrentUser(); // Lấy user hiện tại
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        String role = currentUser.getRole().getName().trim().toUpperCase();

        if ("ADMIN".equals(role)) {
            return toResponse(appointment);
        }

        // Bệnh nhân chỉ được xem lịch của mình
        if ("PATIENT".equals(role)) {
            Long ownerUserId = appointment.getPatient().getUser().getId();
            if (!ownerUserId.equals(currentUser.getId())) {
                throw new IllegalArgumentException("You are not allowed to view this appointment");
            }
            return toResponse(appointment);
        }

        // Doctor chỉ được xem lịch của mình
        if ("DOCTOR".equals(role)) {
            Long doctorUserId = appointment.getDoctor().getUser().getId();
            if (!doctorUserId.equals(currentUser.getId())) {
                throw new IllegalArgumentException("You are not allowed to view this appointment");
            }
            return toResponse(appointment);
        }

        throw new IllegalArgumentException("Invalid role");
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments() {
        User currentUser = getCurrentUser();
        Patient patient = patientRepository.findByUser_Id(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return appointmentRepository.findByPatient_Id(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId) {
        User currentUser = getCurrentUser();
        String role = currentUser.getRole().getName().trim().toUpperCase();

        if ("DOCTOR".equals(role)) {
            Doctor currentDoctor = doctorRepository.findByUser_Id(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            if (!currentDoctor.getId().equals(doctorId)) {
                throw new IllegalArgumentException("You are not allowed to view appointments of another doctor");
            }
        } else if (!"ADMIN".equals(role)) {
            throw new IllegalArgumentException("Invalid role");
        }

        return appointmentRepository.findByDoctor_Id(doctorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AppointmentResponse updateStatus(Long id, UpdateAppointmentStatusRequest request) {
        User currentUser = getCurrentUser();
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        String role = currentUser.getRole().getName().trim().toUpperCase();
        if ("DOCTOR".equals(role)) {
            Doctor currentDoctor = doctorRepository.findByUser_Id(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
                    System.out.println("=== DEBUG CHECK XÁC NHẬN LỊCH ===");
System.out.println("1. ID Bác sĩ của ca khám: " + appointment.getDoctor().getId());
System.out.println("2. ID Bác sĩ đang Login: " + currentDoctor.getId());
         if (appointment.getDoctor().getId().longValue() != currentDoctor.getId().longValue()) {
    throw new IllegalArgumentException("You are not allowed to update this appointment");
}
        } else if (!"ADMIN".equals(role)) {
            throw new IllegalArgumentException("Invalid role");
        }

        AppointmentStatus newStatus;
        try {
            newStatus = AppointmentStatus.valueOf(request.status().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status. Allowed: CONFIRMED, CANCELLED, COMPLETED");
        }

        // Validate status nhập vào hợp lệ
        if (!List.of(
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CANCELLED,
                AppointmentStatus.COMPLETED
        ).contains(newStatus)) {
            throw new IllegalArgumentException("Invalid status. Allowed: CONFIRMED, CANCELLED, COMPLETED");
        }

        // Nếu huỷ → lưu cancelReason và trả lại khung giờ về AVAILABLE
        if (AppointmentStatus.CANCELLED == newStatus) {
            if (!List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED).contains(appointment.getStatus())) {
                throw new IllegalArgumentException("Cannot cancel appointment with status: " + appointment.getStatus());
            }

            appointment.setCancelReason(request.cancelReason());

            DoctorSchedule schedule = appointment.getSchedule();
            if (schedule != null) {
                schedule.setStatus("AVAILABLE");
                doctorScheduleRepository.save(schedule);
            }
        }

        appointment.setStatus(newStatus);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        if (AppointmentStatus.CONFIRMED == newStatus) {
            notificationService.createNotification(
                    savedAppointment.getPatient().getUser(),
                    "Lich kham da duoc xac nhan",
                    "Lich kham cua ban da duoc bac si xac nhan",
                    "APPOINTMENT_CONFIRMED",
                    "APPOINTMENT",
                    savedAppointment.getId()
            );
        } else if (AppointmentStatus.CANCELLED == newStatus) {
            notificationService.createNotification(
                    savedAppointment.getPatient().getUser(),
                    "Lich kham da bi huy",
                    "Lich kham cua ban da bi huy",
                    "APPOINTMENT_CANCELLED",
                    "APPOINTMENT",
                    savedAppointment.getId()
            );
        }

        return toResponse(savedAppointment);
    }

    @Override
    @Transactional
    public CancelAppointmentResponse cancelAppointment(Long id) {
        User currentUser = getCurrentUser();
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        Long ownerUserId = appointment.getPatient().getUser().getId();
        if (!ownerUserId.equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not allowed to cancel this appointment");
        }

        if (!List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED).contains(appointment.getStatus())) {
            throw new IllegalArgumentException("Cannot cancel appointment with status: " + appointment.getStatus());
        }

        // Tính hoàn tiền dựa vào giờ còn lại trước lịch khám
        DoctorSchedule schedule = appointment.getSchedule();
        int refundPercent = 0;
        BigDecimal refundAmount = BigDecimal.ZERO;
        String refundNote;

        if (schedule != null && appointment.getAppointmentDate() != null) {
            LocalDateTime appointmentDateTime = LocalDateTime.of(
                    appointment.getAppointmentDate(), schedule.getStartTime());
            long hoursUntil = ChronoUnit.HOURS.between(LocalDateTime.now(), appointmentDateTime);

            if (hoursUntil > 24) {
                refundPercent = 100;
                refundNote = "Huy truoc 24h - hoan 100%";
            } else if (hoursUntil >= 6) {
                refundPercent = 40;
                refundNote = "Huy trong 6-24h - hoan 40%";
            } else {
                refundPercent = 0;
                refundNote = "Huy trong vong 6h - khong duoc hoan tien";
            }

            // Tìm BOOKING payment đã PAID để tính số tiền hoàn
            List<Payment> bookingPayments = paymentRepository.findByAppointment_Id(appointment.getId());
            BigDecimal paidAmount = bookingPayments.stream()
                    .filter(p -> "BOOKING".equals(p.getPaymentType()) && "PAID".equals(p.getStatus()))
                    .map(Payment::getAmount)
                    .findFirst()
                    .orElse(BigDecimal.ZERO);

            refundAmount = paidAmount.multiply(BigDecimal.valueOf(refundPercent)).divide(BigDecimal.valueOf(100));
        } else {
            refundNote = "Khong co thong tin lich - khong hoan tien";
        }

        // Trả lại khung giờ
        if (schedule != null) {
            schedule.setStatus("AVAILABLE");
            doctorScheduleRepository.save(schedule);
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelReason("Benh nhan tu huy");
        appointmentRepository.save(appointment);

        notificationService.createNotification(
                appointment.getDoctor().getUser(),
                "Benh nhan da huy lich",
                "Benh nhan " + appointment.getPatient().getUser().getFullName() + " da huy lich kham",
                "APPOINTMENT_CANCELLED",
                "APPOINTMENT",
                appointment.getId()
        );

        return new CancelAppointmentResponse(appointment.getId(), refundPercent, refundAmount, refundNote);
    }

    private User getCurrentUser() {
        // lấy thông tin xác thực của người dùng hiện tại, lấy ra user đang đăng nhập
        // gán user đó vào principal
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        return userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    // Helper: convert Appointment entity → AppointmentResponse DTO
    private AppointmentResponse toResponse(Appointment a) {
        DoctorSchedule schedule = a.getSchedule();

        return new AppointmentResponse(
                a.getId(),
                a.getPatient().getId(),
                a.getPatient().getUser().getFullName(),
                a.getDoctor().getId(),
                a.getDoctor().getUser().getFullName(),
                schedule != null ? schedule.getId() : null,
                a.getAppointmentDate(),
                schedule != null ? schedule.getStartTime() : null,
                schedule != null ? schedule.getEndTime() : null,
                a.getReason(),
                a.getStatus() != null ? a.getStatus().name() : null,
                a.getCancelReason(),
                a.getCreatedAt(),
                a.getPaymentDeadline()
        );
    }
}
