package com.ricebugai.aiinsectapi.v1.dtos.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginRequestDTO {

    private String email;

    private String password;

}
