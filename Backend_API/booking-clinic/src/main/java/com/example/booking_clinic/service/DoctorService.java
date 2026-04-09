package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.doctor.CreateDoctorRequest;
import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorStatusRequest;

import java.util.List;

public interface DoctorService {

    List<DoctorResponse> getAllDoctors(Long specialtyId, String keyword);

    DoctorResponse getDoctorById(Long id);

    DoctorResponse createDoctor(CreateDoctorRequest request);

    DoctorResponse updateDoctor(Long id, UpdateDoctorRequest request);

    DoctorResponse updateDoctorStatus(Long id, UpdateDoctorStatusRequest request);
}
