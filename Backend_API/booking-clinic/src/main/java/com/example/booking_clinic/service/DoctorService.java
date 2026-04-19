package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorProfileRequest;

public interface DoctorService {
    DoctorResponse updateMyProfile(UpdateDoctorProfileRequest request);
}
