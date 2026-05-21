package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.entity.AiDocument;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.repository.AiDocumentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.SpecialtyRepository;
import com.example.booking_clinic.service.AiEmbeddingService;
import com.example.booking_clinic.service.AiKnowledgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiKnowledgeServiceImpl implements AiKnowledgeService {

    private final AiDocumentRepository aiDocumentRepository;
    private final SpecialtyRepository specialtyRepository;
    private final DoctorRepository doctorRepository;
    private final AiEmbeddingService aiEmbeddingService;

    @Override
    @Transactional
    public int rebuildIndex() {
        aiDocumentRepository.deleteAll();

        List<AiDocument> documents = new ArrayList<>();

        for (Specialty specialty : specialtyRepository.findAll()) {
            String content = "Chuyên khoa " + specialty.getName()
                    + ". Mô tả: " + nullToEmpty(specialty.getDescription());

            documents.add(buildDocument(
                    "SPECIALTY",
                    specialty.getId(),
                    specialty.getName(),
                    content
            ));
        }

        for (Doctor doctor : doctorRepository.findAll()) {
            String doctorName = doctor.getUser() != null ? doctor.getUser().getFullName() : "Bác sĩ";
            String specialtyName = doctor.getSpecialty() != null ? doctor.getSpecialty().getName() : "";

            String content = "Bác sĩ " + doctorName
                    + ". Chuyên khoa: " + specialtyName
                    + ". Kinh nghiệm: " + doctor.getExperienceYears() + " năm."
                    + " Phòng khám: " + nullToEmpty(doctor.getClinicRoom())
                    + ". Phí khám: " + doctor.getConsultationFee();

            documents.add(buildDocument(
                    "DOCTOR",
                    doctor.getId(),
                    doctorName,
                    content
            ));
        }

        aiDocumentRepository.saveAll(documents);
        return documents.size();
    }

    private AiDocument buildDocument(String sourceType, Long sourceId, String title, String content) {
        List<Double> vector = aiEmbeddingService.embed(content);

        return AiDocument.builder()
                .sourceType(sourceType)
                .sourceId(sourceId)
                .title(title)
                .content(content)
                .embedding(aiEmbeddingService.serialize(vector))
                .build();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}