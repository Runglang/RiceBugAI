package com.ricebugai.aiinsectapi.v1.dtos.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterMemberRequestDTO {

    private String username;

    private String firstname;

    private String lastname;

    private String password;

    private String email;

    private String address;

}
