package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "member")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @Column(name = "member_id")
    private String memberID;

    private String username;

    private String firstname;

    private String lastname;

    private String password;

    private String email;

    private String address;


    @OneToMany(mappedBy = "member")
    private List<AnalysisResult> analysisResults;


    @OneToMany(mappedBy = "member")
    private List<CalculationResult> calculationResults;


    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<Field> fields;

}
