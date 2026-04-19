package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.patient.PatientResponse;
import com.example.booking_clinic.dto.patient.UpdatePatientRequest;

public interface PatientService {
    PatientResponse getMyProfile();
    PatientResponse updateMyProfile(UpdatePatientRequest request);
}
