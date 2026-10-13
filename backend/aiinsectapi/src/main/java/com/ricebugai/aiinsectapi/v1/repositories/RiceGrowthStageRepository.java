package com.ricebugai.aiinsectapi.v1.repositories;

import com.ricebugai.aiinsectapi.v1.entities.RiceGrowthStage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiceGrowthStageRepository extends JpaRepository<RiceGrowthStage, String> {
}
