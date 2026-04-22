package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.medical_record.CreateMedicalRecordRequest;
import com.example.booking_clinic.dto.medical_record.MedicalRecordResponse;
import com.example.booking_clinic.dto.medical_record.UpdateMedicalRecordRequest;

public interface MedicalRecordService {

    MedicalRecordResponse createMedicalRecord(CreateMedicalRecordRequest request);

    MedicalRecordResponse getMedicalRecordById(Long id);

    MedicalRecordResponse getMedicalRecordByAppointmentId(Long appointmentId);

    MedicalRecordResponse updateMedicalRecord(Long id, UpdateMedicalRecordRequest request);
}
