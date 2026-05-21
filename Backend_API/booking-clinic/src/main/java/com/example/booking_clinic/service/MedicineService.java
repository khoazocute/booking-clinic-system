package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.medicine.CreateMedicineRequest;
import com.example.booking_clinic.dto.medicine.MedicineResponse;
import com.example.booking_clinic.dto.medicine.UpdateMedicineRequest;
import com.example.booking_clinic.dto.medicine.UpdateMedicineStatusRequest;

import java.util.List;

public interface MedicineService {
    List<MedicineResponse> getAllMedicines();

    MedicineResponse getMedicineById(Long id);

    MedicineResponse createMedicine(CreateMedicineRequest request);

    MedicineResponse updateMedicine(Long id, UpdateMedicineRequest request);

    MedicineResponse updateMedicineStatus(Long id, UpdateMedicineStatusRequest request);

    void deductStock(Long medicineId, int quantity);

    void restoreStock(Long medicineId, int quantity);
}
