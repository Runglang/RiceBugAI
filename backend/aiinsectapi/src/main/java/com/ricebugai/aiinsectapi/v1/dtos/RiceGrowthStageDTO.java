package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiceGrowthStageDTO {

    private String stageID;

    private String stageName;

    private String stageDes;

    private String durationRange;

}
