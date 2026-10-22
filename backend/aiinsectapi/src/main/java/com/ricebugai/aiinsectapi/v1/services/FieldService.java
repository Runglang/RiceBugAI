package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.FieldDTO;
import com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO;
import com.ricebugai.aiinsectapi.v1.entities.Field;
import com.ricebugai.aiinsectapi.v1.entities.Member;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.repositories.FieldRepository;
import com.ricebugai.aiinsectapi.v1.repositories.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FieldService {

    private final FieldRepository fieldRepository;
    private final MemberRepository memberRepository;
    private final RiceGrowthStageCalculator stageCalculator;

    public FieldDTO addField(String memberID, FieldDTO dto) {
        Member member = memberRepository.findById(memberID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลสมาชิก"));

        Field field = Field.builder()
                .fieldID(UUID.randomUUID().toString())
                .fieldName(dto.getFieldName())
                .plantingDate(dto.getPlantingDate())
                .areaRai(dto.getAreaRai())
                .areaNgan(dto.getAreaNgan())
                .areaSqWah(dto.getAreaSqWah())
                .province(dto.getProvince())
                .district(dto.getDistrict())
                .subdistrict(dto.getSubdistrict())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .member(member)
                .build();

        return toDTO(fieldRepository.save(field));
    }

    public List<FieldDTO> getAllByMember(String memberID) {
        int maxAge = stageCalculator.getMaxGrowthStageAge();

        return fieldRepository.findByMember_MemberID(memberID).stream()
                .map(this::toDTO)
                .filter(dto -> dto.getRiceAge() <= maxAge)
                .collect(Collectors.toList());
    }

    public FieldDTO getFieldById(String memberID, String fieldID) {
        Field field = fieldRepository.findById(fieldID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแปลงนา"));
        if (field.getMember() != null && !field.getMember().getMemberID().equals(memberID)) {
            throw new IllegalArgumentException("ไม่มีสิทธิ์เข้าถึงแปลงนานี้");
        }
        return toDTO(field);
    }

    public FieldDTO updateField(String memberID, String fieldID, FieldDTO dto) {
        Field field = fieldRepository.findById(fieldID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแปลงนา"));
        if (field.getMember() != null && !field.getMember().getMemberID().equals(memberID)) {
            throw new IllegalArgumentException("ไม่มีสิทธิ์แก้ไขแปลงนานี้");
        }

        if (dto.getFieldName() != null) {
            field.setFieldName(dto.getFieldName());
        }
        if (dto.getPlantingDate() != null) {
            field.setPlantingDate(dto.getPlantingDate());
        }
        if (dto.getAreaRai() != null) {
            field.setAreaRai(dto.getAreaRai());
        }
        if (dto.getAreaNgan() != null) {
            field.setAreaNgan(dto.getAreaNgan());
        }
        if (dto.getAreaSqWah() != null) {
            field.setAreaSqWah(dto.getAreaSqWah());
        }
        if (dto.getProvince() != null) {
            field.setProvince(dto.getProvince());
        }
        if (dto.getDistrict() != null) {
            field.setDistrict(dto.getDistrict());
        }
        if (dto.getSubdistrict() != null) {
            field.setSubdistrict(dto.getSubdistrict());
        }
        if (dto.getLatitude() != null) {
            field.setLatitude(dto.getLatitude());
        }
        if (dto.getLongitude() != null) {
            field.setLongitude(dto.getLongitude());
        }

        return toDTO(fieldRepository.save(field));
    }

    public void deleteField(String memberID, String fieldID) {
        Field field = fieldRepository.findById(fieldID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแปลงนา"));
        if (field.getMember() != null && !field.getMember().getMemberID().equals(memberID)) {
            throw new IllegalArgumentException("ไม่มีสิทธิ์ลบแปลงนานี้");
        }
        fieldRepository.delete(field);
    }

    private FieldDTO toDTO(Field field) {
        Long riceAge = 0L;
        if (field.getPlantingDate() != null) {
            riceAge = ChronoUnit.DAYS.between(field.getPlantingDate(), LocalDate.now());
            if (riceAge < 0)
                riceAge = 0L;
        }
        RiceGrowthStageDTO currentStage = stageCalculator.calculateGrowthStage(riceAge);

        return FieldDTO.builder()
                .fieldID(field.getFieldID())
                .fieldName(field.getFieldName())
                .plantingDate(field.getPlantingDate())
                .areaRai(field.getAreaRai())
                .areaNgan(field.getAreaNgan())
                .areaSqWah(field.getAreaSqWah())
                .province(field.getProvince())
                .district(field.getDistrict())
                .subdistrict(field.getSubdistrict())
                .latitude(field.getLatitude())
                .longitude(field.getLongitude())
                .memberID(field.getMember() != null ? field.getMember().getMemberID() : null)
                .riceAge(riceAge)
                .currentGrowthStage(currentStage)
                .build();
    }

}
