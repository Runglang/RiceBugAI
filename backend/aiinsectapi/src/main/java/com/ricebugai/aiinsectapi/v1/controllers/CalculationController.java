package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.CalculationResultDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.CalculationRequestDTO;
import com.ricebugai.aiinsectapi.v1.services.CalculationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members/{memberID}/calculations")
@RequiredArgsConstructor
public class CalculationController {

    private final CalculationService calculationService;

    @PostMapping
    public ResponseEntity<List<CalculationResultDTO>> calculate(
            @PathVariable String memberID,
            @Valid @RequestBody CalculationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calculationService.calculate(memberID, request));
    }

}