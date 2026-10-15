package com.ricebugai.aiinsectapi.v1.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMemberProfileRequestDTO {

    @NotBlank(message = "กรุณากรอกชื่อผู้ใช้")
    private String username;

    private String firstname;

    private String lastname;

    @NotBlank(message = "กรุณากรอกอีเมล")
    @Email(message = "รูปแบบอีเมลไม่ถูกต้อง")
    private String email;

    private String address;

    private String password;

}
