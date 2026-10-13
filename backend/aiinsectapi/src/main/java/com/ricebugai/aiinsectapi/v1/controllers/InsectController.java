package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.InsectDTO;
import com.ricebugai.aiinsectapi.v1.services.InsectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insects")
@RequiredArgsConstructor
public class InsectController {

    private final InsectService insectService;

    @GetMapping
    public ResponseEntity<List<InsectDTO>> getAll() {
        return ResponseEntity.ok(insectService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InsectDTO> getInsectById(@PathVariable String id) {
        return ResponseEntity.ok(insectService.getInsectById(id));
    }

    @PostMapping
    public ResponseEntity<InsectDTO> addInsect(@Valid @RequestBody InsectDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(insectService.addInsect(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InsectDTO> editInsect(@PathVariable String id, @Valid @RequestBody InsectDTO dto) {
        return ResponseEntity.ok(insectService.editInsect(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInsect(@PathVariable String id) {
        insectService.deleteInsect(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<InsectDTO> uploadInsectImage(
            @PathVariable String id,
            @RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(insectService.uploadInsectImage(id, image));
    }

}
