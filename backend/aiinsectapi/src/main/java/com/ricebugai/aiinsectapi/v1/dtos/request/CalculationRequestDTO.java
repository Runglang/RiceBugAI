package com.ricebugai.aiinsectapi.v1.dtos.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculationRequestDTO {

    private String insectID;

    // Architecture ใหม่: รับพื้นที่แยก 3 หน่วยเป็นหลัก
    private Integer areaRai;

    private Integer areaNgan;

    private Integer areaSqWah;

    // รองรับระบบเก่า (Legacy / Fallback)
    private Double areaSize;

    private String areaUnit;

    private Double waterPerRai;

}
