package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChemicalDTO {

    private String chemicalID;

    private String chemicalName;

    private String activeIngredient;

    private String property;

    private String usageMethod;

    private Double dosageRate;

    private String dosageUnit; // new

    private String toxicityLevel;

    private String chemicalImg; // response = URL, request = ไม่ต้องกรอก

    private String description;

    private String warning;

    // ตอน add/edit: ส่งแค่ insectID ในแต่ละ object พอ (targetInsectType จาก SRS)
    private List<InsectDTO> targetInsects;

}
