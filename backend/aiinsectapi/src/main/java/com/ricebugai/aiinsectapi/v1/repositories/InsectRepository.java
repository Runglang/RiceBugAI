package com.ricebugai.aiinsectapi.v1.repositories;

import com.ricebugai.aiinsectapi.v1.entities.Insect;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InsectRepository extends JpaRepository<Insect, String> {

    Optional<Insect> findByInsectName(String insectName);

    boolean existsByInsectName(String insectName);

    List<Insect> findByChemicals_ChemicalID(String chemicalID);

}
