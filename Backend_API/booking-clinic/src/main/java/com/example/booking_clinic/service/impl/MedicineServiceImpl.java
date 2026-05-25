package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.InsufficientStockException;
import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.medicine.CreateMedicineRequest;
import com.example.booking_clinic.dto.medicine.MedicineResponse;
import com.example.booking_clinic.dto.medicine.UpdateMedicineRequest;
import com.example.booking_clinic.dto.medicine.UpdateMedicineStatusRequest;
import com.example.booking_clinic.entity.Medicine;
import com.example.booking_clinic.entity.enums.MedicineStatus;
import com.example.booking_clinic.repository.MedicineRepository;
import com.example.booking_clinic.service.MedicineService;
import com.example.booking_clinic.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineServiceImpl implements MedicineService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final MedicineRepository medicineRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "medicines", key = "'all'")
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
    @CacheEvict(value = {"medicines", "medicine"}, allEntries = true)
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
                        .stockQuantity(request.stockQuantity())
                        .build()
        );

        return toResponse(medicine);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"medicines", "medicine"}, allEntries = true)
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

        if (request.stockQuantity() != null) {
            medicine.setStockQuantity(request.stockQuantity());
        }

        return toResponse(medicineRepository.save(medicine));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"medicines", "medicine"}, allEntries = true)
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

    @Override
    @Transactional
    @CacheEvict(value = {"medicines", "medicine"}, allEntries = true)
    public void deductStock(Long medicineId, int quantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + medicineId));

        int newStock = medicine.getStockQuantity() - quantity;
        if (newStock < 0) {
            throw new InsufficientStockException(
                    "Insufficient stock for: " + medicine.getName() +
                    ". Available: " + medicine.getStockQuantity() + ", Required: " + quantity
            );
        }

        medicine.setStockQuantity(newStock);
        medicineRepository.save(medicine);

        if (newStock <= LOW_STOCK_THRESHOLD) {
            String alertType = newStock == 0 ? "OUT_OF_STOCK" : "LOW_STOCK";
            String title = newStock == 0 ? "Thuoc da het hang" : "Canh bao ton kho thap";
            String message = "Thuoc \"" + medicine.getName() + "\" con lai " + newStock
                    + " " + medicine.getUnit() + ". Can nhap them hang.";
            notificationService.createNotificationForAdmins(title, message, alertType, "MEDICINE", medicineId);
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"medicines", "medicine"}, allEntries = true)
    public void restoreStock(Long medicineId, int quantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + medicineId));

        medicine.setStockQuantity(medicine.getStockQuantity() + quantity);
        medicineRepository.save(medicine);
    }

    private String computeStockStatus(int stockQuantity) {
        if (stockQuantity == 0) return "OUT_OF_STOCK";
        if (stockQuantity <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
        return "IN_STOCK";
    }

    private MedicineResponse toResponse(Medicine medicine) {
        int stock = medicine.getStockQuantity() != null ? medicine.getStockQuantity() : 0;
        return new MedicineResponse(
                medicine.getId(),
                medicine.getName(),
                medicine.getUnitPrice(),
                medicine.getUnit(),
                medicine.getStatus() != null ? medicine.getStatus().name() : null,
                stock,
                computeStockStatus(stock),
                medicine.getCreatedAt()
        );
    }
}
