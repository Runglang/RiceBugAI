package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.ChemicalDTO;
import com.ricebugai.aiinsectapi.v1.services.ChemicalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chemicals")
@RequiredArgsConstructor
public class ChemicalController {

    private final ChemicalService chemicalService;

    @GetMapping
    public ResponseEntity<List<ChemicalDTO>> getAll() {
        return ResponseEntity.ok(chemicalService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChemicalDTO> getChemicalById(@PathVariable String id) {
        return ResponseEntity.ok(chemicalService.getChemicalById(id));
    }

    @PostMapping
    public ResponseEntity<ChemicalDTO> addChemical(@Valid @RequestBody ChemicalDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chemicalService.addChemical(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChemicalDTO> editChemical(@PathVariable String id, @Valid @RequestBody ChemicalDTO dto) {
        return ResponseEntity.ok(chemicalService.editChemical(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChemical(@PathVariable String id) {
        chemicalService.deleteChemical(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<ChemicalDTO> uploadChemicalImage(
            @PathVariable String id,
            @RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(chemicalService.uploadChemicalImage(id, image));
    }

}
