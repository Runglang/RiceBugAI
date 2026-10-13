package com.ricebugai.aiinsectapi.v1.repositories;

import com.ricebugai.aiinsectapi.v1.entities.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, String> {

    Optional<Member> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameAndMemberIDNot(String username, String memberID);

    boolean existsByEmailAndMemberIDNot(String email, String memberID);

}
