package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.MemberDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.MemberLoginRequestDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.RegisterMemberRequestDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.UpdateMemberProfileRequestDTO;
import com.ricebugai.aiinsectapi.v1.entities.Member;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.exceptions.DuplicateDataException;
import com.ricebugai.aiinsectapi.v1.exceptions.InvalidCredentialException;
import com.ricebugai.aiinsectapi.v1.repositories.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MemberAuthService {

    private final MemberRepository memberRepository;

    public MemberDTO getMemberProfile(String memberID) {
        Member member = memberRepository.findById(memberID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลสมาชิก"));
        return toDTO(member);
    }

    public MemberDTO updateMemberProfile(String memberID, UpdateMemberProfileRequestDTO request) {
        Member member = memberRepository.findById(memberID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลสมาชิก"));

        String newUsername = request.getUsername().trim();
        String newEmail = request.getEmail().trim();

        if (memberRepository.existsByUsernameAndMemberIDNot(newUsername, memberID)) {
            throw new DuplicateDataException("ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว");
        }
        if (memberRepository.existsByEmailAndMemberIDNot(newEmail, memberID)) {
            throw new DuplicateDataException("อีเมลนี้มีอยู่ในระบบแล้ว");
        }

        member.setUsername(newUsername);
        member.setFirstname(request.getFirstname() != null ? request.getFirstname().trim() : null);
        member.setLastname(request.getLastname() != null ? request.getLastname().trim() : null);
        member.setEmail(newEmail);
        member.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        Member saved = memberRepository.save(member);
        return toDTO(saved);
    }

    public MemberDTO registerMember(RegisterMemberRequestDTO request) {
        if (memberRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateDataException("ข้อมูลผู้ใช้ซ้ำกรุณาลองใหม่อีกครั้ง");
        }
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateDataException("ข้อมูลผู้ใช้ซ้ำกรุณาลองใหม่อีกครั้ง");
        }

        Member member = Member.builder()
                .memberID(UUID.randomUUID().toString())
                .username(request.getUsername())
                .firstname(request.getFirstname() != null ? request.getFirstname().trim() : null)
                .lastname(request.getLastname() != null ? request.getLastname().trim() : null)
                .password(request.getPassword())
                .email(request.getEmail())
                .address(request.getAddress())
                .build();

        Member saved = memberRepository.save(member);
        return toDTO(saved);
    }

    public MemberDTO loginMember(MemberLoginRequestDTO request) {
        Member member = memberRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialException("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"));

        if (!member.getPassword().equals(request.getPassword())) {
            throw new InvalidCredentialException("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        }

        return toDTO(member);
    }

    private MemberDTO toDTO(Member member) {
        return MemberDTO.builder()
                .memberID(member.getMemberID())
                .username(member.getUsername())
                .firstname(member.getFirstname())
                .lastname(member.getLastname())
                .email(member.getEmail())
                .address(member.getAddress())
                .build();
    }

}
