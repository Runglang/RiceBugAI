package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "field")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Field {

    @Id
    @Column(name = "field_id")
    private String fieldID;

    private String fieldName;

    private LocalDate plantingDate;

    private Integer areaRai;

    private Integer areaNgan;

    private Integer areaSqWah;

    private String province;

    private String district;

    private String subdistrict;

    private Double latitude;

    private Double longitude;


    // Many Field -> 1 Member
    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;


    @OneToMany(mappedBy = "field")
    private List<AnalysisResult> analysisResults;

}
