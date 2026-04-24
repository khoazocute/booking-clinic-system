package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.appointment.AppointmentResponse;
import com.example.booking_clinic.dto.appointment.CreateAppointmentRequest;
import com.example.booking_clinic.dto.appointment.UpdateAppointmentStatusRequest;

import java.util.List;

public interface AppointmentService {

    // Bệnh nhân đặt lịch (cần userId của người đang đăng nhập)
    AppointmentResponse createAppointment(CreateAppointmentRequest request);

    // Lấy chi tiết 1 lịch hẹn theo id, truyền cả role và user hiện tại để biết ai đang gọi 
    // và chỉ cho phép đúng người và đúng role được phép xem
    AppointmentResponse getAppointmentById(Long id);

    // Lịch hẹn của bệnh nhân đang đăng nhập
    List<AppointmentResponse> getMyAppointments();

    // Lịch hẹn của 1 bác sĩ (dùng cho doctor/admin)
    List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId);

    // Tất cả lịch hẹn trong hệ thống (chỉ admin)
    List<AppointmentResponse> getAllAppointments();

    // Cập nhật trạng thái (doctor/admin)
    AppointmentResponse updateStatus(Long id, UpdateAppointmentStatusRequest request);

    // Bệnh nhân huỷ lịch của chính mình
    void cancelAppointment(Long id);
}
