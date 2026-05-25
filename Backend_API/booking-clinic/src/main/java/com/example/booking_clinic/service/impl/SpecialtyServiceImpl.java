package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.specialty.CreateSpecialtyRequest;
import com.example.booking_clinic.dto.specialty.SpecialtyResponse;
import com.example.booking_clinic.dto.specialty.UpdateSpecialtyRequest;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.repository.SpecialtyRepository;
import com.example.booking_clinic.service.SpecialtyService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialtyServiceImpl implements SpecialtyService {

    private final SpecialtyRepository specialtyRepository;
//Thêm các annotation @Cacheable vào các phương thức getAllSpecialties và getSpecialtyById
// để lưu trữ kết quả trả về trong cache.
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "specialties", key = "'all'")
    public List<SpecialtyResponse> getAllSpecialties() {
        return specialtyRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public SpecialtyResponse getSpecialtyById(Long id) {
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found with id: " + id));
        return toResponse(specialty);
    }

    @Override
    @Transactional
//Thêm annotation @CacheEvict vào các phương thức createSpecialty, updateSpecialty và deleteSpecialty để xóa cache khi có sự thay đổi dữ liệu.
    @CacheEvict(value = {"specialties", "specialty", "doctors", "doctor"}, allEntries = true)
    public SpecialtyResponse createSpecialty(CreateSpecialtyRequest request) {
        if (specialtyRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Specialty name already exists: " + request.name());
        }

        Specialty specialty = specialtyRepository.save(
                Specialty.builder()
                        .name(request.name())
                        .description(request.description())
                        .build()
        );

        return toResponse(specialty);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"specialties", "specialty", "doctors", "doctor"}, allEntries = true)
    public SpecialtyResponse updateSpecialty(Long id, UpdateSpecialtyRequest request) {
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            if (specialtyRepository.existsByNameAndIdNot(request.name(), id)) {
                throw new IllegalArgumentException("Specialty name already exists: " + request.name());
            }
            specialty.setName(request.name());
        }

        if (request.description() != null) {
            specialty.setDescription(request.description());
        }

        return toResponse(specialtyRepository.save(specialty));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"specialties", "specialty", "doctors", "doctor"}, allEntries = true)
    public void deleteSpecialty(Long id) { // TODO: Waiting for Khoa to implement Doctor Service
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found with id: " + id));

        try {
            specialtyRepository.delete(specialty);
            specialtyRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Cannot delete specialty because it is still referenced by one or more doctors");
        }
    }

    private SpecialtyResponse toResponse(Specialty specialty) {
        return new SpecialtyResponse(
                specialty.getId(),
                specialty.getName(),
                specialty.getDescription(),
                specialty.getCreatedAt(),
                specialty.getUpdatedAt()
        );
    }
}
