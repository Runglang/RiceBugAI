package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.FieldDTO;
import com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO;
import com.ricebugai.aiinsectapi.v1.entities.Field;
import com.ricebugai.aiinsectapi.v1.entities.Member;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.repositories.FieldRepository;
import com.ricebugai.aiinsectapi.v1.repositories.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FieldServiceTest {

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private RiceGrowthStageCalculator stageCalculator;

    @InjectMocks
    private FieldService fieldService;

    private Member member;
    private Field field;

    @BeforeEach
    void setUp() {
        member = Member.builder()
                .memberID("mem-123")
                .username("testuser")
                .build();

        field = Field.builder()
                .fieldID("field-abc")
                .fieldName("แปลงเดิม")
                .plantingDate(LocalDate.now().minusDays(10))
                .areaRai(5)
                .areaNgan(2)
                .areaSqWah(50)
                .province("ขอนแก่น")
                .district("เมืองขอนแก่น")
                .subdistrict("ในเมือง")
                .member(member)
                .build();
    }

    @Test
    @DisplayName("getFieldById - Success")
    void getFieldById_Success() {
        when(fieldRepository.findById("field-abc")).thenReturn(Optional.of(field));
        when(stageCalculator.calculateGrowthStage(any(Long.class)))
                .thenReturn(RiceGrowthStageDTO.builder().stageName("ระยะกล้า").build());

        FieldDTO result = fieldService.getFieldById("mem-123", "field-abc");

        assertNotNull(result);
        assertEquals("field-abc", result.getFieldID());
        assertEquals("แปลงเดิม", result.getFieldName());
        assertEquals("ขอนแก่น", result.getProvince());
    }

    @Test
    @DisplayName("getFieldById - Not Found")
    void getFieldById_NotFound() {
        when(fieldRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () ->
                fieldService.getFieldById("mem-123", "non-existent")
        );
    }

    @Test
    @DisplayName("getFieldById - Unauthorized Member")
    void getFieldById_Unauthorized() {
        when(fieldRepository.findById("field-abc")).thenReturn(Optional.of(field));

        assertThrows(IllegalArgumentException.class, () ->
                fieldService.getFieldById("other-member", "field-abc")
        );
    }

    @Test
    @DisplayName("updateField - Success")
    void updateField_Success() {
        FieldDTO updateDTO = FieldDTO.builder()
                .fieldName("แปลงแก้ไขใหม่")
                .plantingDate(LocalDate.now().minusDays(20))
                .areaRai(10)
                .areaNgan(1)
                .areaSqWah(20)
                .province("เชียงใหม่")
                .district("แม่ริม")
                .subdistrict("ริมใต้")
                .build();

        when(fieldRepository.findById("field-abc")).thenReturn(Optional.of(field));
        when(fieldRepository.save(any(Field.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stageCalculator.calculateGrowthStage(any(Long.class)))
                .thenReturn(RiceGrowthStageDTO.builder().stageName("ระยะแตกกอ").build());

        FieldDTO updated = fieldService.updateField("mem-123", "field-abc", updateDTO);

        assertNotNull(updated);
        assertEquals("แปลงแก้ไขใหม่", updated.getFieldName());
        assertEquals(10, updated.getAreaRai());
        assertEquals(1, updated.getAreaNgan());
        assertEquals(20, updated.getAreaSqWah());
        assertEquals("เชียงใหม่", updated.getProvince());
        assertEquals("แม่ริม", updated.getDistrict());
        assertEquals("ริมใต้", updated.getSubdistrict());
        verify(fieldRepository, times(1)).save(field);
    }

    @Test
    @DisplayName("updateField - Unauthorized")
    void updateField_Unauthorized() {
        FieldDTO updateDTO = FieldDTO.builder()
                .fieldName("แปลงแก้ไขใหม่")
                .build();

        when(fieldRepository.findById("field-abc")).thenReturn(Optional.of(field));

        assertThrows(IllegalArgumentException.class, () ->
                fieldService.updateField("other-member", "field-abc", updateDTO)
        );
        verify(fieldRepository, never()).save(any());
    }
}
