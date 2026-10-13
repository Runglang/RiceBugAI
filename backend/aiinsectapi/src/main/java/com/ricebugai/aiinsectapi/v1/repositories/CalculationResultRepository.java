package com.ricebugai.aiinsectapi.v1.repositories;

import com.ricebugai.aiinsectapi.v1.entities.CalculationResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalculationResultRepository extends JpaRepository<CalculationResult, String> {

    List<CalculationResult> findByMember_MemberID(String memberID);

}
