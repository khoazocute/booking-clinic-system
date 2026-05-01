package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.medicine.CreateMedicineRequest;
import com.example.booking_clinic.dto.medicine.MedicineResponse;
import com.example.booking_clinic.dto.medicine.UpdateMedicineRequest;
import com.example.booking_clinic.dto.medicine.UpdateMedicineStatusRequest;
import com.example.booking_clinic.entity.Medicine;
import com.example.booking_clinic.entity.enums.MedicineStatus;
import com.example.booking_clinic.repository.MedicineRepository;
import com.example.booking_clinic.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MedicineResponse> getAllMedicines() {
        return medicineRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MedicineResponse getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        return toResponse(medicine);
    }

    @Override
    @Transactional
    public MedicineResponse createMedicine(CreateMedicineRequest request) {
        String normalizedName = request.name().trim();
        if (medicineRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Medicine name already exists: " + normalizedName);
        }

        Medicine medicine = medicineRepository.save(
                Medicine.builder()
                        .name(normalizedName)
                        .unitPrice(request.unitPrice())
                        .unit(request.unit().trim())
                        .status(MedicineStatus.ACTIVE)
                        .build()
        );

        return toResponse(medicine);
    }

    @Override
    @Transactional
    public MedicineResponse updateMedicine(Long id, UpdateMedicineRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            String normalizedName = request.name().trim();
            if (medicineRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
                throw new IllegalArgumentException("Medicine name already exists: " + normalizedName);
            }
            medicine.setName(normalizedName);
        }

        if (request.unitPrice() != null) {
            medicine.setUnitPrice(request.unitPrice());
        }

        if (request.unit() != null && !request.unit().isBlank()) {
            medicine.setUnit(request.unit().trim());
        }

        return toResponse(medicineRepository.save(medicine));
    }

    @Override
    @Transactional
    public MedicineResponse updateMedicineStatus(Long id, UpdateMedicineStatusRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        MedicineStatus status;
        try {
            status = MedicineStatus.valueOf(request.status().trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid status. Allowed: ACTIVE, INACTIVE");
        }

        medicine.setStatus(status);
        return toResponse(medicineRepository.save(medicine));
    }

    private MedicineResponse toResponse(Medicine medicine) {
        return new MedicineResponse(
                medicine.getId(),
                medicine.getName(),
                medicine.getUnitPrice(),
                medicine.getUnit(),
                medicine.getStatus() != null ? medicine.getStatus().name() : null
        );
    }
}
