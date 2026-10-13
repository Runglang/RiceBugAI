package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuxiliaryResultDTO {

    private String stage; // seedling / tillering / heading

    private String stageName; // ระยะกล้า / ระยะแตกกอ / ระยะออกรวง

    private String insectName;

    private Double confidenceScore;

}