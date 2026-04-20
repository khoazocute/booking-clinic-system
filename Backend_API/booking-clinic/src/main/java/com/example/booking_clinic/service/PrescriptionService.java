package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.prescription.CreatePrescriptionRequest;
import com.example.booking_clinic.dto.prescription.PrescriptionResponse;

public interface PrescriptionService {
    PrescriptionResponse createPrescription(CreatePrescriptionRequest request);
}
