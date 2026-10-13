package com.ricebugai.aiinsectapi.v1.dtos;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDTO {

    private String memberID;

    private String username;

    private String firstname;

    private String lastname;

    private String email;

    private String address;

}
