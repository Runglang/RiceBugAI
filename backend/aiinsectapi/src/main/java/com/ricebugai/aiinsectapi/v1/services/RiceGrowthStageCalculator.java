package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO;
import com.ricebugai.aiinsectapi.v1.entities.RiceGrowthStage;
import com.ricebugai.aiinsectapi.v1.repositories.RiceGrowthStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RiceGrowthStageCalculator {

    private final RiceGrowthStageRepository riceGrowthStageRepository;

    public RiceGrowthStageDTO calculateGrowthStage(Long riceAge) {
        for (RiceGrowthStage stage : riceGrowthStageRepository.findAll()) {
            int[] range = parseRange(stage.getDurationRange());
            if (range == null)
                continue;

            if (riceAge >= range[0] && riceAge <= range[1]) {
                return RiceGrowthStageDTO.builder()
                        .stageID(stage.getStageID())
                        .stageName(stage.getStageName())
                        .stageDes(stage.getStageDes())
                        .durationRange(stage.getDurationRange())
                        .build();
            }
        }
        return null;
    }

    public int getMaxGrowthStageAge() {
        return riceGrowthStageRepository.findAll().stream()
                .map(s -> parseRange(s.getDurationRange()))
                .filter(r -> r != null)
                .mapToInt(r -> r[1])
                .max()
                .orElse(Integer.MAX_VALUE);
    }

    private int[] parseRange(String durationRange) {
        if (durationRange == null)
            return null;
        String[] parts = durationRange.split("-");
        if (parts.length != 2)
            return null;
        try {
            return new int[] { Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim()) };
        } catch (NumberFormatException e) {
            return null;
        }
    }

}