package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.AdminDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.AdminLoginRequestDTO;
import com.ricebugai.aiinsectapi.v1.entities.Admin;
import com.ricebugai.aiinsectapi.v1.exceptions.InvalidCredentialException;
import com.ricebugai.aiinsectapi.v1.repositories.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminRepository adminRepository;

    public AdminDTO loginAdmin(AdminLoginRequestDTO request) {
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialException("ไม่พบข้อมูลผู้ใช้"));

        if (!admin.getPassword().equals(request.getPassword())) {
            throw new InvalidCredentialException("ไม่พบข้อมูลผู้ใช้");
        }

        return AdminDTO.builder()
                .adminID(admin.getAdminID())
                .email(admin.getEmail())
                .build();
    }

}
