package com.ricebugai.aiinsectapi.v1.repositories;

import com.ricebugai.aiinsectapi.v1.entities.Chemical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChemicalRepository extends JpaRepository<Chemical, String> {

    Optional<Chemical> findByChemicalName(String chemicalName);

    boolean existsByChemicalName(String chemicalName);

}
