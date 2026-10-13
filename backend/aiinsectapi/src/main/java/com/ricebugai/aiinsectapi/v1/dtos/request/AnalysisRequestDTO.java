package com.ricebugai.aiinsectapi.v1.dtos.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisRequestDTO {

    private String stageID;

    private String fieldID; // ไม่บังคับ อาจมาจาก List Planting Rice

    // imageFile รับแยกเป็น @RequestPart("imageFile") MultipartFile ใน Controller ไปเลย
    // ไม่ต้องใส่ในนี้ก็ได้ เพราะไม่ต้อง reuse เป็น response

}
