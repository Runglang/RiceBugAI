package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.AdminDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.AdminLoginRequestDTO;
import com.ricebugai.aiinsectapi.v1.services.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admins")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ResponseEntity<AdminDTO> loginAdmin(@Valid @RequestBody AdminLoginRequestDTO request) {
        return ResponseEntity.ok(adminAuthService.loginAdmin(request));
    }

}
