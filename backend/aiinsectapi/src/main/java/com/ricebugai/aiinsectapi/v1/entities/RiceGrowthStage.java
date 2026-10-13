package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "rice_growth_stage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiceGrowthStage {

    @Id
    @Column(name = "stage_id")
    private String stageID;

    private String stageName;

    @Column(length = 1000)
    private String stageDes;

    private String durationRange;


    @ManyToMany(mappedBy = "riceGrowthStages")
    private Set<Insect> insects;


    @OneToMany(mappedBy = "riceGrowthStage")
    private Set<AnalysisResult> analysisResults;


}
