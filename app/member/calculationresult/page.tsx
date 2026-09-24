"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Droplets,
  Bug,
  ArrowLeft,
  Calculator,
  AlertTriangle,
  Loader2,
  MapPin,
  Clock,
  Beaker,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalculationResultDTO {
  calculationID: string;
  calculateDate: string;
  areaSize: number;
  areaUnit: string;
  calculatedAmount: number;
  amountUnit: string;
  waterPerRai: number | null;
  insect: { insectID: string; insectName: string };
  chemical: {
    chemicalID: string;
    chemicalName: string;
    dosageRate: number;
    dosageUnit: string;
    usageMethod: string;
  };
}

const USAGE_LABEL: Record<string, string> = {
  foliar_spray: "พ่นทางใบ",
  broadcast: "หว่าน/โรยเม็ด",
};

const USAGE_DESCRIPTION: Record<string, string> = {
  foliar_spray: "ผสมสารเคมีกับน้ำตามปริมาณที่กำหนด แล้วพ่นให้ทั่วใบข้าว",
  broadcast: "หว่านหรือโรยเม็ดสารเคมีให้ทั่วแปลงนา",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalculationResultPage() {
  const router = useRouter();
  const [results, setResults] = useState<CalculationResultDTO[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = sessionStorage.getItem("calculation_results");
        if (stored) {
          const parsed: CalculationResultDTO[] = JSON.parse(stored);
          setResults(parsed);
        }
      } catch {
        setResults(null);
      }
      setLoading(false);
    });
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        กำลังโหลดผลการคำนวณ...
      </div>
    );
  }

  // ไม่มีข้อมูล (เข้ามาตรง ไม่ได้กดคำนวณ)
  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col items-center justify-center gap-4 px-6">
        <FlaskConical className="w-12 h-12 text-gray-300" />
        <p className="text-sm text-gray-500 text-center">ไม่พบผลการคำนวณ กรุณาทำการคำนวณก่อน</p>
        <button
          onClick={() => router.push("/member/calculation")}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Calculator size={16} />
          ไปหน้าคำนวณ
        </button>
      </div>
    );
  }

  const first = results[0];
  const calcDate = new Date(first.calculateDate);
  const dateStr = calcDate.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = calcDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/member/calculation")}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ผลการคำนวณสารเคมี</h1>
            <p className="text-xs text-gray-400 mt-0.5">คำนวณเสร็จสิ้น</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-4">
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Bug size={15} className="text-green-600" />
              <span>แมลงเป้าหมาย: <strong className="text-gray-900">{first.insect.insectName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={15} className="text-green-600" />
              <span>พื้นที่: <strong className="text-gray-900">{first.areaSize} {first.areaUnit}</strong></span>
            </div>
            {first.waterPerRai != null && (
              <div className="flex items-center gap-2 text-gray-600">
                <Droplets size={15} className="text-blue-500" />
                <span>น้ำ: <strong className="text-gray-900">{first.waterPerRai} ลิตร/ไร่</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={15} className="text-gray-400" />
              <span className="text-xs text-gray-400">{dateStr} · {timeStr}</span>
            </div>
          </div>
        </div>

        {/* Result heading */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <FlaskConical size={16} className="text-green-600" />
          <h2 className="text-sm font-bold text-gray-900">
            สารเคมีที่แนะนำ ({results.length} ชนิด)
          </h2>
        </div>

        {/* Chemical result cards */}
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.calculationID}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Card header — chemical name + amount */}
              <div className="px-5 py-4 sm:px-6 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {r.chemical.chemicalName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      <Beaker size={11} />
                      {USAGE_LABEL[r.chemical.usageMethod] ?? r.chemical.usageMethod}
                    </span>
                    <span className="text-xs text-gray-400">
                      อัตรา: {r.chemical.dosageRate} {r.chemical.dosageUnit}
                    </span>
                  </div>
                </div>

                {/* Big amount */}
                <div className="text-right shrink-0">
                  <p className="text-2xl sm:text-3xl font-black text-green-700 leading-none">
                    {r.calculatedAmount}
                  </p>
                  <p className="text-xs font-semibold text-green-600 mt-1">
                    {r.amountUnit}
                  </p>
                </div>
              </div>

              {/* Card footer — usage hint */}
              <div className="px-5 py-3 sm:px-6 bg-green-50 border-t border-green-100">
                <p className="text-xs text-green-700 leading-relaxed">
                  💡 {USAGE_DESCRIPTION[r.chemical.usageMethod] ?? "ใช้ตามคำแนะนำของผู้ผลิต"}
                </p>
                {r.waterPerRai != null && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Droplets size={11} />
                    ใช้น้ำ {r.waterPerRai} ลิตร/ไร่ ในการผสม
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="mt-5 flex gap-3 px-1">
          <AlertTriangle size={16} className="shrink-0 text-amber-500 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">ข้อสงวนสิทธิ์:</strong> ปริมาณที่แสดงเป็นการประมาณการจากอัตราการใช้มาตรฐาน
            โปรดตรวจสอบกับคำแนะนำของผู้ผลิตสารเคมีและเจ้าหน้าที่ส่งเสริมการเกษตรในพื้นที่ก่อนใช้งานจริง
          </p>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/member/calculation")}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white text-sm font-semibold py-3 hover:bg-green-700 transition-colors"
          >
            <Calculator size={16} />
            คำนวณใหม่
          </button>
          <button
            onClick={() => router.push("/member/dashboard")}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-semibold py-3 hover:bg-gray-50 transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>

      </div>
    </div>
  );
}
