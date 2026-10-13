package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "calculation_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculationResult {

    @Id
    @Column(name = "calculation_id")
    private String calculationID;

    private LocalDateTime calculateDate;

    // ข้อมูลพื้นที่แยกหน่วย (Architecture ใหม่)
    private Integer areaRai;

    private Integer areaNgan;

    private Integer areaSqWah;

    // พื้นที่รวมหน่วยไร่ (คงไว้เพื่อ backward compatibility กับประวัติเดิม)
    private Double areaSize;

    private String areaUnit;

    private Double calculatedAmount;

    private String amountUnit;

    private Double waterPerRai;

    @ManyToOne
    @JoinColumn(name = "insect_id")
    private Insect insect;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne
    @JoinColumn(name = "chemical_id")
    private Chemical chemical;

}
