package com.ricebugai.aiinsectapi.v1.services;

import com.ricebugai.aiinsectapi.v1.dtos.CalculationResultDTO;
import com.ricebugai.aiinsectapi.v1.dtos.ChemicalDTO;
import com.ricebugai.aiinsectapi.v1.dtos.InsectDTO;
import com.ricebugai.aiinsectapi.v1.dtos.request.CalculationRequestDTO;
import com.ricebugai.aiinsectapi.v1.entities.*;
import com.ricebugai.aiinsectapi.v1.exceptions.DataNotFoundException;
import com.ricebugai.aiinsectapi.v1.repositories.CalculationResultRepository;
import com.ricebugai.aiinsectapi.v1.repositories.InsectRepository;
import com.ricebugai.aiinsectapi.v1.repositories.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CalculationService {

    private final CalculationResultRepository calculationResultRepository;
    private final InsectRepository insectRepository;
    private final MemberRepository memberRepository;

    // 3.1.13 Calculate Chemical — คำนวณสารเคมีทุกชนิดที่ผูกกับแมลงนั้นในครั้งเดียว
    public List<CalculationResultDTO> calculate(String memberID, CalculationRequestDTO request) {

        if (request.getInsectID() == null || request.getInsectID().trim().isEmpty()) {
            throw new IllegalArgumentException("กรุณาเลือกชนิดแมลงศัตรูพืชเป้าหมาย");
        }

        // Architecture ใหม่: คำนวณ totalRai จาก areaRai, areaNgan, areaSqWah (ถ้ามีส่งมา)
        // หรือ fallback ไปใช้ convertToRai(areaSize, areaUnit) สำหรับ request แบบเดิม
        double totalRai;
        Integer rai = request.getAreaRai();
        Integer ngan = request.getAreaNgan();
        Integer sqWah = request.getAreaSqWah();

        if (rai != null || ngan != null || sqWah != null) {
            int r = rai != null ? rai : 0;
            int n = ngan != null ? ngan : 0;
            int w = sqWah != null ? sqWah : 0;

            if (r <= 0 && n <= 0 && w <= 0) {
                throw new IllegalArgumentException("กรุณาระบุขนาดพื้นที่ให้ถูกต้อง");
            }
            totalRai = r + (n * 0.25) + (w * 0.0025);
        } else if (request.getAreaSize() != null && request.getAreaSize() > 0) {
            totalRai = convertToRai(request.getAreaSize(), request.getAreaUnit());
        } else {
            throw new IllegalArgumentException("กรุณาระบุขนาดพื้นที่ให้ถูกต้อง");
        }

        Member member = memberRepository.findById(memberID)
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลสมาชิก"));

        Insect insect = insectRepository.findById(request.getInsectID())
                .orElseThrow(() -> new DataNotFoundException("ไม่พบข้อมูลแมลง"));

        Set<Chemical> chemicals = insect.getChemicals();

        // 6.1.1 - กรณีไม่พบข้อมูลสูตรคำนวณสำหรับแมลงชนิดที่เลือก
        if (chemicals == null || chemicals.isEmpty()) {
            throw new DataNotFoundException("ขออภัย ไม่พบข้อมูลอัตราการใช้สารเคมีสำหรับแมลงชนิดนี้");
        }

        // คำนวณทุกสารเคมีที่ผูกกับแมลงตัวนี้ แล้ว save ทีละ record ต่อ 1 สารเคมี
        return chemicals.stream()
                .map(chemical -> calculateOne(member, insect, chemical, request, totalRai))
                .collect(Collectors.toList());
    }

    private CalculationResultDTO calculateOne(Member member, Insect insect, Chemical chemical,
            CalculationRequestDTO request, double totalRai) {

        double calculatedAmount;
        String amountUnit;
        String dosageUnit = chemical.getDosageUnit();

        if (isPerRaiUnit(dosageUnit)) {
            // กลุ่ม 1: ml/rai, L/rai, g/rai, kg/rai → คูณพื้นที่ totalRai ตรงๆ ไม่เกี่ยวกับน้ำ
            calculatedAmount = chemical.getDosageRate() * totalRai;
            amountUnit = stripPerRaiSuffix(dosageUnit);

        } else if (isPer20LUnit(dosageUnit)) {
            // กลุ่ม 2: ml/20L, g/20L → ต้องมี waterPerRai มาคำนวณด้วย
            if (request.getWaterPerRai() == null || request.getWaterPerRai() <= 0) {
                throw new IllegalArgumentException(
                        "สารเคมี " + chemical.getChemicalName() + " ต้องระบุปริมาณน้ำที่ใช้ต่อไร่ (waterPerRai) ด้วย");
            }
            calculatedAmount = (chemical.getDosageRate() / 20.0) * request.getWaterPerRai() * totalRai;
            amountUnit = stripPer20LSuffix(dosageUnit);

        } else {
            // หน่วยที่ระบบยังไม่รู้จัก ป้องกันไม่ให้คำนวณผิดเงียบๆ
            throw new IllegalArgumentException(
                    "สารเคมี " + chemical.getChemicalName() + " มีหน่วย dosageUnit ที่ระบบยังไม่รองรับ: " + dosageUnit);
        }

        CalculationResult result = CalculationResult.builder()
                .calculationID(UUID.randomUUID().toString())
                .calculateDate(LocalDateTime.now())
                .areaRai(request.getAreaRai())
                .areaNgan(request.getAreaNgan())
                .areaSqWah(request.getAreaSqWah())
                .areaSize(totalRai)
                .areaUnit(request.getAreaUnit() != null ? request.getAreaUnit() : "ไร่")
                .calculatedAmount(Math.round(calculatedAmount * 100.0) / 100.0) // ปัดทศนิยม 2 ตำแหน่ง
                .amountUnit(amountUnit)
                .waterPerRai(request.getWaterPerRai())
                .member(member)
                .insect(insect)
                .chemical(chemical)
                .build();

        CalculationResult saved = calculationResultRepository.save(result);
        return toDTO(saved);
    }

    // ⚠️ สมมติฐาน: 1 ไร่ = 4 งาน = 400 ตารางวา = 1600 ตารางเมตร (หน่วยไทยมาตรฐาน)
    // areaUnit ที่รับได้: "ไร่", "ตารางวา", "ตารางเมตร" (ตรงตาม SRS 3.1.13)
    private double convertToRai(double areaSize, String areaUnit) {
        if (areaUnit == null)
            return areaSize; // ไม่ระบุหน่วย ถือว่าเป็นไร่อยู่แล้ว

        return switch (areaUnit.trim()) {
            case "ไร่" -> areaSize;
            case "งาน" -> areaSize / 4.0;
            case "ตารางวา" -> areaSize / 400.0;
            case "ตารางเมตร" -> areaSize / 1600.0;
            default -> throw new IllegalArgumentException("หน่วยพื้นที่ไม่ถูกต้อง: " + areaUnit);
        };
    }

    private boolean isPerRaiUnit(String unit) {
        return unit != null && (unit.equals("ml/rai") || unit.equals("L/rai")
                || unit.equals("g/rai") || unit.equals("kg/rai"));
    }

    private boolean isPer20LUnit(String unit) {
        return unit != null && (unit.equals("ml/20L") || unit.equals("g/20L"));
    }

    private String stripPerRaiSuffix(String unit) {
        return unit.replace("/rai", "");
    }

    private String stripPer20LSuffix(String unit) {
        return unit.replace("/20L", "");
    }

    private CalculationResultDTO toDTO(CalculationResult r) {
        return CalculationResultDTO.builder()
                .calculationID(r.getCalculationID())
                .calculateDate(r.getCalculateDate())
                .areaRai(r.getAreaRai())
                .areaNgan(r.getAreaNgan())
                .areaSqWah(r.getAreaSqWah())
                .areaSize(r.getAreaSize())
                .areaUnit(r.getAreaUnit())
                .calculatedAmount(r.getCalculatedAmount())
                .amountUnit(r.getAmountUnit())
                .waterPerRai(r.getWaterPerRai())
                .insect(InsectDTO.builder()
                        .insectID(r.getInsect().getInsectID())
                        .insectName(r.getInsect().getInsectName())
                        .build())
                .chemical(ChemicalDTO.builder()
                        .chemicalID(r.getChemical().getChemicalID())
                        .chemicalName(r.getChemical().getChemicalName())
                        .dosageRate(r.getChemical().getDosageRate())
                        .dosageUnit(r.getChemical().getDosageUnit())
                        .usageMethod(r.getChemical().getUsageMethod())
                        .build())
                .build();
    }

}
