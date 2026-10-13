package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.AnalysisResultDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.AnalysisRequestDTO;
import com.ricebugai.aiinsectapi.v1.services.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members/{memberID}/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResultDTO> analyze(
            @PathVariable String memberID,
            @RequestPart("data") AnalysisRequestDTO request,
            @RequestPart("image") MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED).body(analysisService.analyze(memberID, request, image));
    }

    @GetMapping
    public ResponseEntity<List<AnalysisResultDTO>> getHistory(@PathVariable String memberID) {
        return ResponseEntity.ok(analysisService.getAnalysisHistory(memberID));
    }

}