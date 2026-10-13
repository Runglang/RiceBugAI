package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.FieldDTO;
import com.ricebugai.aiinsectapi.v1.services.FieldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members/{memberID}/fields")
@RequiredArgsConstructor
public class FieldController {

    private final FieldService fieldService;

    @PostMapping
    public ResponseEntity<FieldDTO> addField(@PathVariable String memberID, @Valid @RequestBody FieldDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fieldService.addField(memberID, dto));
    }

    @GetMapping
    public ResponseEntity<List<FieldDTO>> getAllByMember(@PathVariable String memberID) {
        return ResponseEntity.ok(fieldService.getAllByMember(memberID));
    }

    @GetMapping("/{fieldID}")
    public ResponseEntity<FieldDTO> getFieldById(@PathVariable String memberID, @PathVariable String fieldID) {
        return ResponseEntity.ok(fieldService.getFieldById(memberID, fieldID));
    }

    @PutMapping("/{fieldID}")
    public ResponseEntity<FieldDTO> updateField(
            @PathVariable String memberID,
            @PathVariable String fieldID,
            @Valid @RequestBody FieldDTO dto) {
        return ResponseEntity.ok(fieldService.updateField(memberID, fieldID, dto));
    }

    @DeleteMapping("/{fieldID}")
    public ResponseEntity<Void> deleteField(@PathVariable String memberID, @PathVariable String fieldID) {
        fieldService.deleteField(memberID, fieldID);
        return ResponseEntity.noContent().build();
    }
}
