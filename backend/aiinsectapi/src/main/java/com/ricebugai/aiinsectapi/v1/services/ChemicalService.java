package com.ricebugai.aiinsectapi.v1.services;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import com.ricebugai.aiinsectapi.v1.dtos.ChemicalDTO;
import com.ricebugai.aiinsectapi.v1.dtos.InsectDTO;
import com.ricebugai.aiinsectapi.v1.entities.Chemical;
import com.ricebugai.aiinsectapi.v1.entities.Insect;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.exceptions.DuplicateDataException;
import com.ricebugai.aiinsectapi.v1.repositories.ChemicalRepository;
import com.ricebugai.aiinsectapi.v1.repositories.InsectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChemicalService {

    private final ChemicalRepository chemicalRepository;
    private final InsectRepository insectRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public List<ChemicalDTO> getAll() {
        return chemicalRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ChemicalDTO getChemicalById(String id) {
        return toDTO(findEntity(id));
    }

    public ChemicalDTO addChemical(ChemicalDTO dto) {
        if (chemicalRepository.existsByChemicalName(dto.getChemicalName())) {
            throw new DuplicateDataException("มีข้อมูลสารเคมีนี้อยู่แล้ว");
        }

        Chemical chemical = Chemical.builder()
                .chemicalID(UUID.randomUUID().toString())
                .build();

        applyFields(chemical, dto);

        Chemical saved = chemicalRepository.save(chemical);
        syncInsectRelations(saved, dto.getTargetInsects());

        return toDTO(saved);
    }

    public ChemicalDTO editChemical(String id, ChemicalDTO dto) {
        Chemical chemical = findEntity(id);
        applyFields(chemical, dto);

        Chemical saved = chemicalRepository.save(chemical);
        syncInsectRelations(saved, dto.getTargetInsects());

        return toDTO(saved);
    }

    @Transactional
    public void deleteChemical(String id) {
        Chemical chemical = findEntity(id);

        List<Insect> relatedInsects = insectRepository.findByChemicals_ChemicalID(id);

        for (Insect insect : relatedInsects) {
            insect.getChemicals().remove(chemical);
            insectRepository.save(insect);
        }

        chemicalRepository.delete(chemical);
    }

    // =========================
    // Upload Chemical Image
    // =========================

    public ChemicalDTO uploadChemicalImage(String id, MultipartFile file) {
        Chemical chemical = findEntity(id);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("กรุณาแนบไฟล์รูปภาพ");
        }

        try {
            File dir = new File(uploadDir, "chemicals");

            if (!dir.exists()) {
                dir.mkdirs();
            }

            String ext = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + ext;

            File dest = new File(dir, filename);
            file.transferTo(dest);

            String imageUrl = "http://localhost:8080/uploads/chemicals/" + filename;

            chemical.setChemicalImg(imageUrl);

            return toDTO(chemicalRepository.save(chemical));

        } catch (IOException e) {
            throw new RuntimeException("อัปโหลดรูปภาพไม่สำเร็จ", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }

        return filename.substring(filename.lastIndexOf('.'));
    }

    // แค่เติม scalar field เท่านั้น ไม่ save ไม่ยุ่ง relation
    private void applyFields(Chemical chemical, ChemicalDTO dto) {
        chemical.setChemicalName(dto.getChemicalName());
        chemical.setActiveIngredient(dto.getActiveIngredient());
        chemical.setProperty(dto.getProperty());
        chemical.setUsageMethod(dto.getUsageMethod());
        chemical.setDosageRate(dto.getDosageRate());
        chemical.setDosageUnit(dto.getDosageUnit()); // new
        chemical.setToxicityLevel(dto.getToxicityLevel());
        chemical.setDescription(dto.getDescription());
        chemical.setWarning(dto.getWarning());

        if (dto.getChemicalImg() != null) {
            chemical.setChemicalImg(dto.getChemicalImg());
        }
    }

    // แยกหน้าที่จัดการความสัมพันธ์ ManyToMany ออกมาต่างหาก
    // (owning side คือ Insect)
    private void syncInsectRelations(Chemical chemical, List<InsectDTO> targetInsects) {
        if (targetInsects == null)
            return;

        Set<String> newInsectIds = targetInsects.stream()
                .map(InsectDTO::getInsectID)
                .collect(Collectors.toSet());

        List<Insect> currentlyRelated = insectRepository.findByChemicals_ChemicalID(chemical.getChemicalID());

        // ลบความสัมพันธ์ที่ไม่ได้เลือกแล้ว
        for (Insect insect : currentlyRelated) {
            if (!newInsectIds.contains(insect.getInsectID())) {
                insect.getChemicals().remove(chemical);
                insectRepository.save(insect);
            }
        }

        // เพิ่มความสัมพันธ์ใหม่ที่ยังไม่มี
        for (String insectId : newInsectIds) {
            Insect insect = insectRepository.findById(insectId)
                    .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแมลง"));
            if (!insect.getChemicals().contains(chemical)) {
                insect.getChemicals().add(chemical);
                insectRepository.save(insect);
            }
        }
    }

    private Chemical findEntity(String id) {
        return chemicalRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลสารเคมี"));
    }

    private ChemicalDTO toDTO(Chemical chemical) {
        return ChemicalDTO.builder()
                .chemicalID(chemical.getChemicalID())
                .chemicalName(chemical.getChemicalName())
                .activeIngredient(chemical.getActiveIngredient())
                .property(chemical.getProperty())
                .usageMethod(chemical.getUsageMethod())
                .dosageRate(chemical.getDosageRate())
                .dosageUnit(chemical.getDosageUnit()) // new
                .toxicityLevel(chemical.getToxicityLevel())
                .chemicalImg(chemical.getChemicalImg())
                .description(chemical.getDescription())
                .warning(chemical.getWarning())
                .targetInsects(
                        chemical.getInsects() == null
                                ? List.of()
                                : chemical.getInsects().stream()
                                        .map(i -> InsectDTO.builder()
                                                .insectID(i.getInsectID())
                                                .insectName(i.getInsectName())
                                                .scientificName(i.getScientificName())
                                                .insectImg(i.getInsectImg())
                                                .build())
                                        .collect(Collectors.toList()))
                .build();
    }
}