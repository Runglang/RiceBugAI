package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO;
import com.ricebugai.aiinsectapi.v1.entities.RiceGrowthStage;
import com.ricebugai.aiinsectapi.v1.repositories.RiceGrowthStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rice-growth-stages")
@RequiredArgsConstructor
public class RiceGrowthStageController {

    private final RiceGrowthStageRepository riceGrowthStageRepository;

    @GetMapping
    public ResponseEntity<List<RiceGrowthStageDTO>> getAll() {
        return ResponseEntity.ok(riceGrowthStageRepository.findAll().stream()
                .map(this::toDTO).collect(Collectors.toList()));
    }

    private RiceGrowthStageDTO toDTO(RiceGrowthStage s) {
        return RiceGrowthStageDTO.builder()
                .stageID(s.getStageID())
                .stageName(s.getStageName())
                .stageDes(s.getStageDes())
                .durationRange(s.getDurationRange())
                .build();
    }

}