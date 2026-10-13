package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.InsectDTO;
import com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO;
import com.ricebugai.aiinsectapi.v1.entities.Insect;
import com.ricebugai.aiinsectapi.v1.entities.RiceGrowthStage;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.exceptions.DuplicateDataException;
import com.ricebugai.aiinsectapi.v1.repositories.InsectRepository;
import com.ricebugai.aiinsectapi.v1.repositories.RiceGrowthStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value; // ← เพิ่ม
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile; // ← เพิ่ม

import java.io.File; // ← เพิ่ม
import java.io.IOException; // ← เพิ่ม
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.ArrayList; // ← เพิ่ม
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsectService {

    private final InsectRepository insectRepository;
    private final RiceGrowthStageRepository riceGrowthStageRepository;

    @Value("${app.upload.dir}") // ← เพิ่ม field นี้
    private String uploadDir;

    public List<InsectDTO> getAll() {
        return insectRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public InsectDTO getInsectById(String id) {
        return toDTO(findEntity(id));
    }

    public InsectDTO addInsect(InsectDTO dto) {
        if (insectRepository.existsByInsectName(dto.getInsectName())) {
            throw new DuplicateDataException("มีข้อมูลแมลงชนิดนี้อยู่แล้ว");
        }

        Insect insect = Insect.builder()
                .insectID(UUID.randomUUID().toString())
                .insectName(dto.getInsectName())
                .scientificName(dto.getScientificName())
                .insectType(dto.getInsectType())
                .dangerLevel(dto.getDangerLevel())
                .insectDes(dto.getInsectDes())
                .insectImg(dto.getInsectImg())
                .riceGrowthStages(resolveStages(dto.getRiceGrowthStages()))
                .build();

        return toDTO(insectRepository.save(insect));
    }

    public InsectDTO editInsect(String id, InsectDTO dto) {
        Insect insect = findEntity(id);

        insect.setInsectName(dto.getInsectName());
        insect.setScientificName(dto.getScientificName());
        insect.setInsectType(dto.getInsectType());
        insect.setDangerLevel(dto.getDangerLevel());
        insect.setInsectDes(dto.getInsectDes());
        if (dto.getInsectImg() != null) {
            insect.setInsectImg(dto.getInsectImg());
        }
        insect.setRiceGrowthStages(resolveStages(dto.getRiceGrowthStages()));

        return toDTO(insectRepository.save(insect));
    }

    public void deleteInsect(String id) {
        insectRepository.delete(findEntity(id));
    }

    private Insect findEntity(String id) {
        return insectRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแมลง"));
    }

    private Set<RiceGrowthStage> resolveStages(List<RiceGrowthStageDTO> stages) {
        if (stages == null)
            return new HashSet<>();
        return stages.stream()
                .map(s -> riceGrowthStageRepository.findById(s.getStageID())
                        .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลระยะการเจริญเติบโต")))
                .collect(Collectors.toSet());
    }

    private InsectDTO toDTO(Insect insect) {
        return InsectDTO.builder()
                .insectID(insect.getInsectID())
                .insectName(insect.getInsectName())
                .scientificName(insect.getScientificName())
                .insectType(insect.getInsectType())
                .dangerLevel(insect.getDangerLevel())
                .insectDes(insect.getInsectDes())
                .insectImg(insect.getInsectImg())
                .riceGrowthStages(insect.getRiceGrowthStages() == null ? List.of()
                        : insect.getRiceGrowthStages().stream()
                                .map(s -> RiceGrowthStageDTO.builder()
                                        .stageID(s.getStageID())
                                        .stageName(s.getStageName())
                                        .stageDes(s.getStageDes())
                                        .durationRange(s.getDurationRange())
                                        .build())
                                .collect(Collectors.toList()))
                .build();
    }

    public InsectDTO uploadInsectImage(String id, MultipartFile file) {
        Insect insect = findEntity(id);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("กรุณาแนบไฟล์รูปภาพ");
        }

        try {
            File dir = new File(uploadDir, "insects"); // ← เปลี่ยนตรงนี้ เพิ่ม "insects" subfolder
            if (!dir.exists())
                dir.mkdirs();

            String ext = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + ext;
            File dest = new File(dir, filename);
            file.transferTo(dest);

            String imageUrl = "http://localhost:8080/uploads/insects/" + filename;
            List<String> images = insect.getInsectImg();
            if (images == null) {
                images = new ArrayList<>();
            }

            images.add(imageUrl);
            insect.setInsectImg(images);

            return toDTO(insectRepository.save(insect));
        } catch (IOException e) {
            throw new RuntimeException("อัปโหลดรูปภาพไม่สำเร็จ", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "";
        return filename.substring(filename.lastIndexOf('.'));
    }

}
