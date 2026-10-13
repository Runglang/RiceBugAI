package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculationResultDTO {

    private String calculationID;

    private LocalDateTime calculateDate;

    // ข้อมูลพื้นที่แยกหน่วย
    private Integer areaRai;

    private Integer areaNgan;

    private Integer areaSqWah;

    // พื้นที่รวมหน่วยไร่
    private Double areaSize;

    private String areaUnit;

    private Double calculatedAmount;

    private String amountUnit;

    private Double waterPerRai;

    private InsectDTO insect;

    private ChemicalDTO chemical;

}
