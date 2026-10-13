package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.MemberDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.MemberLoginRequestDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.RegisterMemberRequestDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.UpdateMemberProfileRequestDTO;
import com.ricebugai.aiinsectapi.v1.services.MemberAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberAuthController {

    private final MemberAuthService memberAuthService;

    @PostMapping("/register")
    public ResponseEntity<MemberDTO> registerMember(@Valid @RequestBody RegisterMemberRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberAuthService.registerMember(request));
    }

    @PostMapping("/login")
    public ResponseEntity<MemberDTO> loginMember(@Valid @RequestBody MemberLoginRequestDTO request) {
        return ResponseEntity.ok(memberAuthService.loginMember(request));
    }

    @GetMapping("/{memberID}")
    public ResponseEntity<MemberDTO> getProfile(@PathVariable String memberID) {
        return ResponseEntity.ok(memberAuthService.getMemberProfile(memberID));
    }

    @PutMapping("/{memberID}")
    public ResponseEntity<MemberDTO> updateProfile(
            @PathVariable String memberID,
            @Valid @RequestBody UpdateMemberProfileRequestDTO request) {
        return ResponseEntity.ok(memberAuthService.updateMemberProfile(memberID, request));
    }

}
