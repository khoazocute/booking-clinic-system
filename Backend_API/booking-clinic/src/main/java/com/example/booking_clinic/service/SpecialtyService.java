package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.specialty.CreateSpecialtyRequest;
import com.example.booking_clinic.dto.specialty.SpecialtyResponse;
import com.example.booking_clinic.dto.specialty.UpdateSpecialtyRequest;

import java.util.List;

public interface SpecialtyService {

    List<SpecialtyResponse> getAllSpecialties();

    SpecialtyResponse getSpecialtyById(Long id);

    SpecialtyResponse createSpecialty(CreateSpecialtyRequest request);

    SpecialtyResponse updateSpecialty(Long id, UpdateSpecialtyRequest request);

    void deleteSpecialty(Long id);
}
