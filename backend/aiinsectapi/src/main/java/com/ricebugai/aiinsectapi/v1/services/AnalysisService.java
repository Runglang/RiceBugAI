package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.AnalysisResultDTO;
import com.ricebugai.aiinsectapi.v1.dtos.AuxiliaryResultDTO;
import com.ricebugai.aiinsectapi.v1.dtos.InsectDTO;
import com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.AnalysisRequestDTO;
import com.ricebugai.aiinsectapi.v1.entities.AnalysisResult;
import com.ricebugai.aiinsectapi.v1.entities.Field;
import com.ricebugai.aiinsectapi.v1.entities.Insect;
import com.ricebugai.aiinsectapi.v1.entities.Member;
import com.ricebugai.aiinsectapi.v1.entities.RiceGrowthStage;
import com.ricebugai.aiinsectapi.v1.exceptions.AiServiceUnavailableException;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.exceptions.LowConfidenceException;
import com.ricebugai.aiinsectapi.v1.external.AiPredictionResponse;
import com.ricebugai.aiinsectapi.v1.repositories.AnalysisResultRepository;
import com.ricebugai.aiinsectapi.v1.repositories.FieldRepository;
import com.ricebugai.aiinsectapi.v1.repositories.InsectRepository;
import com.ricebugai.aiinsectapi.v1.repositories.MemberRepository;
import com.ricebugai.aiinsectapi.v1.repositories.RiceGrowthStageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AnalysisResultRepository analysisResultRepository;
    private final FieldRepository fieldRepository;
    private final RiceGrowthStageRepository riceGrowthStageRepository;
    private final RiceGrowthStageCalculator stageCalculator;
    private final InsectRepository insectRepository;
    private final MemberRepository memberRepository;
    private final RestTemplate restTemplate;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${ai.api.seedling-url}")
    private String seedlingUrl;

    @Value("${ai.api.tillering-url}")
    private String tilleringUrl;

    @Value("${ai.api.heading-url}")
    private String headingUrl;

    @Value("${ai.confidence-threshold}")
    private double confidenceThreshold;

    // ผลการเรียก AI 1 ระยะ: สำเร็จจะมี response, ล้มเหลวจะมี error
    private record AiCallOutcome(AiPredictionResponse response, RuntimeException error) {
    }

    public AnalysisResultDTO analyze(String memberID, AnalysisRequestDTO request, MultipartFile image) {

        Member member = memberRepository.findById(memberID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลสมาชิก"));

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("กรุณาแนบรูปภาพแมลง");
        }

        RiceGrowthStage stage;
        Field field = null;

        if (request.getFieldID() != null) {
            field = fieldRepository.findById(request.getFieldID())
                    .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแปลงนา"));

            long riceAge = ChronoUnit.DAYS.between(field.getPlantingDate(), LocalDate.now());
            RiceGrowthStageDTO stageDTO = stageCalculator.calculateGrowthStage(riceAge);

            if (stageDTO == null) {
                throw new IllegalStateException("ไม่สามารถระบุระยะการเจริญเติบโตของข้าวในแปลงนี้ได้");
            }
            if ("ระยะสุกแก่".equals(stageDTO.getStageName())) {
                throw new IllegalStateException("แปลงนานี้อยู่ในระยะสุกแก่ ไม่รองรับการวิเคราะห์แมลงในระยะนี้");
            }

            stage = riceGrowthStageRepository.findById(stageDTO.getStageID())
                    .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลระยะการเจริญเติบโต"));

        } else {
            if (request.getStageID() == null) {
                throw new IllegalArgumentException("กรุณาเลือกระยะการเจริญเติบโตของข้าว");
            }
            stage = riceGrowthStageRepository.findById(request.getStageID())
                    .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลระยะการเจริญเติบโต"));

            if ("ระยะสุกแก่".equals(stage.getStageName())) {
                throw new IllegalArgumentException("ระยะสุกแก่ไม่รองรับการวิเคราะห์แมลง");
            }
        }

        // ระยะหลัก = ระยะที่ผู้ใช้เลือก (หรือที่คำนวณจากแปลง) ไม่ใช่ระยะที่ confidence
        // สูงสุด
        String primaryKey = mapStageNameToModelKey(stage.getStageName());

        Map<String, AiCallOutcome> outcomes = callAllModels(image);

        AiCallOutcome primary = outcomes.get(primaryKey);
        if (primary.error() != null) {
            throw primary.error();
        }

        AiPredictionResponse prediction = primary.response();
        if (prediction.confidence() == null || prediction.predicted_label() == null) {
            throw new AiServiceUnavailableException("ระบบ AI ตอบกลับข้อมูลไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง");
        }

        // ผลหลักต่ำกว่าเกณฑ์: ไม่บันทึกผล และยังไม่เซฟรูปลงดิสก์
        if (prediction.confidence() < confidenceThreshold) {
            log.info("ผลหลักต่ำกว่าเกณฑ์: stage={}, label={}, confidence={}, threshold={}",
                    primaryKey, prediction.predicted_label(), prediction.confidence(), confidenceThreshold);
            throw new LowConfidenceException(
                    "ระบบไม่มั่นใจในผลการวิเคราะห์จากภาพนี้ กรุณาถ่ายภาพแมลงใหม่ให้ชัดเจนขึ้น");
        }

        Insect insect = insectRepository.findByInsectName(prediction.predicted_label())
                .orElseThrow(() -> new DataNotFoundException(
                        "ไม่พบข้อมูลแมลงที่ตรงกับผลการวิเคราะห์: " + prediction.predicted_label()));

        String imageUrl = saveAnalysisImage(image);

        AnalysisResult result = AnalysisResult.builder()
                .analysisID(UUID.randomUUID().toString())
                .analysisDate(LocalDateTime.now())
                .analysisImage(imageUrl)
                .confidenceScore(prediction.confidence())
                .member(member)
                .insect(insect)
                .riceGrowthStage(stage)
                .field(field)
                .build();

        AnalysisResult saved = analysisResultRepository.save(result);

        AnalysisResultDTO dto = toDTO(saved);
        dto.setAuxiliaryResults(buildAuxiliaryResults(outcomes, primaryKey));
        return dto;
    }

    public List<AnalysisResultDTO> getAnalysisHistory(String memberID) {
        if (!memberRepository.existsById(memberID)) {
            throw new DataNotFoundException("ไม่พบข้อมูลสมาชิก");
        }
        return analysisResultRepository.findByMember_MemberIDOrderByAnalysisDateDesc(memberID)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private String mapStageNameToModelKey(String stageName) {
        return switch (stageName) {
            case "ระยะกล้า" -> "seedling";
            case "ระยะแตกกอ" -> "tillering";
            case "ระยะออกรวง" -> "heading";
            default -> throw new IllegalStateException("ระยะนี้ไม่รองรับการวิเคราะห์แมลง: " + stageName);
        };
    }

    private Map<String, String> aiUrls() {
        Map<String, String> urls = new LinkedHashMap<>();
        urls.put("seedling", seedlingUrl);
        urls.put("tillering", tilleringUrl);
        urls.put("heading", headingUrl);
        return urls;
    }

    // ยิงทั้ง 3 API พร้อมกันด้วยรูปเดียวกัน (thread ย่อยทำแค่ HTTP ไม่แตะ DB)
    private Map<String, AiCallOutcome> callAllModels(MultipartFile image) {
        final byte[] bytes = readBytes(image);
        final String filename = image.getOriginalFilename();
        final String contentType = image.getContentType();

        Map<String, CompletableFuture<AiCallOutcome>> futures = new LinkedHashMap<>();
        Map<String, AiCallOutcome> outcomes = new LinkedHashMap<>();

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (Map.Entry<String, String> entry : aiUrls().entrySet()) {
                String url = entry.getValue();
                futures.put(entry.getKey(),
                        CompletableFuture.supplyAsync(() -> callOne(url, bytes, filename, contentType), executor));
            }
            futures.forEach((key, future) -> outcomes.put(key, future.join()));
        }
        return outcomes;
    }

    private byte[] readBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("ไม่สามารถอ่านไฟล์รูปภาพได้", e);
        }
    }

    private AiCallOutcome callOne(String baseUrl, byte[] bytes, String filename, String contentType) {
        try {
            return new AiCallOutcome(callAiPredict(baseUrl, bytes, filename, contentType), null);
        } catch (RuntimeException ex) {
            return new AiCallOutcome(null, ex);
        }
    }

    private AiPredictionResponse callAiPredict(String baseUrl, byte[] bytes, String filename, String contentType) {
        // ใช้ชื่อไฟล์ปลอดภัย (ไม่เอาชื่อเดิมที่อาจเป็นภาษาไทย) แต่คงนามสกุลไว้
        final String safeFilename = "image" + getExtension(filename);

        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return safeFilename;
            }
        };

        // ส่ง content-type ของไฟล์ตามที่ผู้ใช้อัปโหลดจริง ไม่ปล่อยให้เดาจากนามสกุล
        HttpHeaders partHeaders = new HttpHeaders();
        if (contentType != null && !contentType.isBlank()) {
            try {
                partHeaders.setContentType(MediaType.parseMediaType(contentType));
            } catch (InvalidMediaTypeException ignored) {
                // ปล่อยว่างไว้ ให้ฝั่ง AI ตัดสินเอง
            }
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(resource, partHeaders));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        try {
            AiPredictionResponse response = restTemplate.postForObject(
                    baseUrl + "/predict", new HttpEntity<>(body, headers), AiPredictionResponse.class);

            if (response == null) {
                throw new AiServiceUnavailableException("ระบบ AI ตอบกลับข้อมูลไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง");
            }
            return response;

        } catch (HttpClientErrorException ex) {
            // 4xx จาก FastAPI = ไฟล์มีปัญหา (ไม่ใช่รูป, ว่างเปล่า, ใหญ่เกิน 10 MB)
            log.warn("AI {} ปฏิเสธไฟล์: {}", baseUrl, ex.getMessage());
            throw new IllegalArgumentException(
                    "ไม่สามารถวิเคราะห์ไฟล์ที่ส่งมาได้ กรุณาใช้ไฟล์รูปภาพที่ถูกต้อง (ขนาดไม่เกิน 10 MB)");

        } catch (RestClientException ex) {
            // 5xx, เชื่อมต่อไม่ได้, timeout
            log.warn("เรียก AI {} ไม่สำเร็จ: {}", baseUrl, ex.getMessage());
            throw new AiServiceUnavailableException("ระบบ AI ไม่พร้อมใช้งานในขณะนี้ กรุณาลองใหม่อีกครั้ง");
        }
    }

    // ผลประกอบ: ข้ามตัวที่ล้มเหลวหรือต่ำกว่าเกณฑ์ ไม่ทำให้ทั้งคำขอล้ม
    private List<AuxiliaryResultDTO> buildAuxiliaryResults(Map<String, AiCallOutcome> outcomes, String primaryKey) {
        List<AuxiliaryResultDTO> results = new ArrayList<>();

        for (Map.Entry<String, AiCallOutcome> entry : outcomes.entrySet()) {
            if (entry.getKey().equals(primaryKey)) {
                continue;
            }

            AiCallOutcome outcome = entry.getValue();
            if (outcome.error() != null) {
                log.warn("ข้ามผลประกอบระยะ {} เพราะเรียก AI ไม่สำเร็จ", entry.getKey());
                continue;
            }

            AiPredictionResponse r = outcome.response();
            if (r.confidence() == null || r.predicted_label() == null || r.confidence() < confidenceThreshold) {
                continue;
            }

            results.add(AuxiliaryResultDTO.builder()
                    .stage(entry.getKey())
                    .stageName(r.stage_th() != null ? r.stage_th() : entry.getKey())
                    .insectName(r.predicted_label())
                    .confidenceScore(r.confidence())
                    .build());
        }
        return results;
    }

    private String saveAnalysisImage(MultipartFile file) {
        try {
            File dir = new File(uploadDir, "analysis");
            if (!dir.exists())
                dir.mkdirs();

            String ext = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + ext;
            File dest = new File(dir, filename);
            file.transferTo(dest);

            return "http://localhost:8080/uploads/analysis/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("อัปโหลดรูปภาพไม่สำเร็จ", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains("."))
            return "";
        return filename.substring(filename.lastIndexOf('.'));
    }

    private AnalysisResultDTO toDTO(AnalysisResult r) {
        return AnalysisResultDTO.builder()
                .analysisID(r.getAnalysisID())
                .analysisDate(r.getAnalysisDate())
                .analysisImage(r.getAnalysisImage())
                .confidenceScore(r.getConfidenceScore())
                .insect(InsectDTO.builder()
                        .insectID(r.getInsect().getInsectID())
                        .insectName(r.getInsect().getInsectName())
                        .insectImg(r.getInsect().getInsectImg())
                        .build())
                .riceGrowthStage(RiceGrowthStageDTO.builder()
                        .stageID(r.getRiceGrowthStage().getStageID())
                        .stageName(r.getRiceGrowthStage().getStageName())
                        .stageDes(r.getRiceGrowthStage().getStageDes())
                        .durationRange(r.getRiceGrowthStage().getDurationRange())
                        .build())
                .fieldID(r.getField() != null ? r.getField().getFieldID() : null)
                .build();
    }

}