package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResult {

    @Id
    @Column(name = "analysis_id")
    private String analysisID;

    private LocalDateTime analysisDate;

    private String analysisImage;

    private Double confidenceScore;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne
    @JoinColumn(name = "insect_id")
    private Insect insect;

    @ManyToOne
    @JoinColumn(name = "stage_id")
    private RiceGrowthStage riceGrowthStage;

    @ManyToOne
    @JoinColumn(name = "field_id", nullable = true)
    private Field field;

}
