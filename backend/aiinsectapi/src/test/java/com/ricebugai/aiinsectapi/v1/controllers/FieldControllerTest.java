package com.ricebugai.aiinsectapi.v1.controllers;

import com.ricebugai.aiinsectapi.v1.dtos.FieldDTO;
import com.ricebugai.aiinsectapi.v1.services.FieldService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FieldController.class)
class FieldControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private FieldService fieldService;

        @Test
        @DisplayName("GET /api/v1/members/{memberID}/fields/{fieldID} - Success")
        void getFieldById_Success() throws Exception {
                FieldDTO dto = FieldDTO.builder()
                                .fieldID("f1")
                                .fieldName("แปลงทดสอบ")
                                .plantingDate(LocalDate.of(2025, 1, 1))
                                .areaRai(5)
                                .areaNgan(1)
                                .areaSqWah(20)
                                .province("ขอนแก่น")
                                .district("เมืองขอนแก่น")
                                .subdistrict("ในเมือง")
                                .build();

                when(fieldService.getFieldById("m1", "f1")).thenReturn(dto);

                mockMvc.perform(get("/api/v1/members/m1/fields/f1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.fieldID").value("f1"))
                                .andExpect(jsonPath("$.fieldName").value("แปลงทดสอบ"))
                                .andExpect(jsonPath("$.province").value("ขอนแก่น"));
        }

        @Test
        @DisplayName("PUT /api/v1/members/{memberID}/fields/{fieldID} - Success")
        void updateField_Success() throws Exception {
                FieldDTO responseDTO = FieldDTO.builder()
                                .fieldID("f1")
                                .fieldName("แปลงแก้ไข")
                                .plantingDate(LocalDate.of(2025, 1, 1))
                                .areaRai(10)
                                .areaNgan(0)
                                .areaSqWah(0)
                                .province("ขอนแก่น")
                                .district("เมืองขอนแก่น")
                                .subdistrict("ในเมือง")
                                .build();

                when(fieldService.updateField(eq("m1"), eq("f1"), any(FieldDTO.class))).thenReturn(responseDTO);

                String json = """
                                {
                                    "fieldName": "แปลงแก้ไข",
                                    "plantingDate": "2025-01-01",
                                    "areaRai": 10,
                                    "areaNgan": 0,
                                    "areaSqWah": 0,
                                    "province": "ขอนแก่น",
                                    "district": "เมืองขอนแก่น",
                                    "subdistrict": "ในเมือง"
                                }
                                """;

                mockMvc.perform(put("/api/v1/members/m1/fields/f1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.fieldID").value("f1"))
                                .andExpect(jsonPath("$.fieldName").value("แปลงแก้ไข"))
                                .andExpect(jsonPath("$.areaRai").value(10));
        }
}
