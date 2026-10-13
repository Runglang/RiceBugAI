package com.ricebugai.aiinsectapi.v1.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;
import java.util.List;

@Entity
@Table(name = "insect")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Insect {

        @Id
        @Column(name = "insect_id")
        private String insectID;

        private String insectName;

        private String scientificName;

        private String insectType;

        private String dangerLevel;

        @Column(length = 10000)
        private String insectDes;

        @ElementCollection
        @CollectionTable(name = "insect_image", joinColumns = @JoinColumn(name = "insect_id"))
        @Column(name = "image_url")
        private List<String> insectImg;

        @ManyToMany
        @JoinTable(name = "insect_chemical", joinColumns = @JoinColumn(name = "insect_id"), inverseJoinColumns = @JoinColumn(name = "chemical_id"))
        private Set<Chemical> chemicals;

        @ManyToMany
        @JoinTable(name = "insect_rice_stage_rel", joinColumns = @JoinColumn(name = "insect_id"), inverseJoinColumns = @JoinColumn(name = "stage_id"))
        private Set<RiceGrowthStage> riceGrowthStages;

}
