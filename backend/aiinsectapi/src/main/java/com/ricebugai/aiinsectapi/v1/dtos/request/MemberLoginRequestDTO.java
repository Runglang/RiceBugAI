package com.ricebugai.aiinsectapi.v1.dtos.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberLoginRequestDTO {

    private String username;

    private String password;

}
