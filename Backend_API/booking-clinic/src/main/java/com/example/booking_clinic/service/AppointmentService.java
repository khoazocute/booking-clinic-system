package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.appointment.AppointmentResponse;
import com.example.booking_clinic.dto.appointment.CancelAppointmentResponse;
import com.example.booking_clinic.dto.appointment.CreateAppointmentRequest;
import com.example.booking_clinic.dto.appointment.UpdateAppointmentStatusRequest;

import java.util.List;

public interface AppointmentService {

    AppointmentResponse createAppointment(CreateAppointmentRequest request);

    AppointmentResponse getAppointmentById(Long id);

    List<AppointmentResponse> getMyAppointments();

    List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId);

    List<AppointmentResponse> getAllAppointments();

    AppointmentResponse updateStatus(Long id, UpdateAppointmentStatusRequest request);

    CancelAppointmentResponse cancelAppointment(Long id);
}
