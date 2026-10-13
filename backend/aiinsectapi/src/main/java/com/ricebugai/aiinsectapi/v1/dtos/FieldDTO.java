package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldDTO {

    private String fieldID;

    private String fieldName;

    private LocalDate plantingDate;

    private Integer areaRai;

    private Integer areaNgan;

    private Integer areaSqWah;

    private String province;

    private String district;

    private String subdistrict;

    private String memberID;

    // 2 ตัวนี้คำนวณอัตโนมัติตอน response เท่านั้น (ไม่ต้องส่งมาตอน request)
    private Long riceAge;

    private RiceGrowthStageDTO currentGrowthStage;

}
