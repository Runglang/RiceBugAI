package com.ricebugai.aiinsectapi.v1.repositories;

import com.ricebugai.aiinsectapi.v1.entities.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, String> {

    List<AnalysisResult> findByMember_MemberID(String memberID);

    List<AnalysisResult> findByMember_MemberIDOrderByAnalysisDateDesc(String memberID);

}
