package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResultDTO {

    private String analysisID;

    private LocalDateTime analysisDate;

    private String analysisImage;

    private Double confidenceScore;

    private InsectDTO insect;

    private RiceGrowthStageDTO riceGrowthStage;

    private String fieldID;

    // ผลประกอบจากโมเดลอีก 2 ระยะ (ไม่บันทึกลง DB, endpoint ประวัติจะเป็น null)
    private List<AuxiliaryResultDTO> auxiliaryResults;

}