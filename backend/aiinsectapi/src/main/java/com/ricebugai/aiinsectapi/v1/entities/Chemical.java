package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.Set;

@Entity
@Table(name = "chemical")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chemical {

    @Id
    @Column(name = "chemical_id")
    private String chemicalID;

    private String chemicalName;

    private String activeIngredient;

    private String property;

    private String usageMethod;

    private Double dosageRate;

    private String dosageUnit; // new

    private String toxicityLevel;

    private String chemicalImg;

    @Column(length = 10000)
    private String description;

    @Column(length = 1000)
    private String warning;

    @ManyToMany(mappedBy = "chemicals")
    private Set<Insect> insects;

    @OneToMany(mappedBy = "chemical")
    private List<CalculationResult> calculationResults;

}
