package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsectDTO {

    private String insectID;

    private String insectName;

    private String scientificName;

    private String insectType;

    private String dangerLevel;

    private String insectDes;

    private List<String> insectImg; // response = URL, request = ไม่ต้องกรอก (รูปส่งแยกเป็น MultipartFile)

    // ตอน add/edit: ส่งแค่ stageID ในแต่ละ object พอ ตัวอื่นปล่อยว่างได้
    private List<RiceGrowthStageDTO> riceGrowthStages;

}
