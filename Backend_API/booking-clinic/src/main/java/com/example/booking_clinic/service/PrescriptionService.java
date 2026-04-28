package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.prescription.CreatePrescriptionRequest;
import com.example.booking_clinic.dto.prescription.PrescriptionDetailResponse;
import com.example.booking_clinic.dto.prescription.PrescriptionResponse;
import com.example.booking_clinic.dto.prescription.UpdatePrescriptionRequest;

public interface PrescriptionService {
    PrescriptionResponse createPrescription(CreatePrescriptionRequest request);

    PrescriptionDetailResponse getPrescriptionById(Long id);

    PrescriptionDetailResponse getPrescriptionByMedicalRecordId(Long medicalRecordId);

    PrescriptionDetailResponse updatePrescription(Long id, UpdatePrescriptionRequest request);
}
