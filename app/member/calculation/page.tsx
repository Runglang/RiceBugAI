"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calculator, ChevronDown, AlertTriangle, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsectOption {
  insectID: string;
  insectName: string;
}

interface FormData {
  insectID: string;
  areaSize: string;
  areaUnit: string;
  waterPerRai: string;
}

const EMPTY_FORM: FormData = {
  insectID: "",
  areaSize: "",
  areaUnit: "ไร่",
  waterPerRai: "",
};

const AREA_UNIT_OPTIONS = [
  { value: "ไร่", label: "ไร่" },
  { value: "ตารางวา", label: "ตารางวา" },
  { value: "ตารางเมตร", label: "ตารางเมตร" },
];

const HOW_IT_WORKS_STEPS = [
  "ระบุชนิดของศัตรูพืชในแปลงของคุณ",
  "วัดหรือประเมินพื้นที่ที่ได้รับผลกระทบ",
  "รับคำแนะนำการผสมได้ทันที",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChemicalCalculatorPage() {
  const router = useRouter();

  // auth
  const [memberID, setMemberID] = useState<string | null>(null);

  // insect list from API
  const [insects, setInsects] = useState<InsectOption[]>([]);
  const [insectsLoading, setInsectsLoading] = useState(true);

  // form
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // submit state
  const [apiError, setApiError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  // ---------- Load memberID from cookie ----------
  useEffect(() => {
    Promise.resolve().then(() => {
      const session = Cookies.get("member_session");
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setMemberID(parsed.memberID ?? null);
        } catch {
          setMemberID(null);
        }
      }
    });
  }, []);

  // ---------- Load insect list ----------
  useEffect(() => {
    const controller = new AbortController();

    async function loadInsects() {
      try {
        const res = await fetch(`${API_ORIGIN}/api/v1/insects`, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (!res.ok) throw new Error("โหลดรายชื่อแมลงไม่สำเร็จ");

        const data: InsectOption[] = await res.json();
        if (controller.signal.aborted) return;

        setInsects(data);
      } catch {
        if (!controller.signal.aborted) {
          setInsects([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setInsectsLoading(false);
        }
      }
    }

    loadInsects();
    return () => { controller.abort(); };
  }, []);

  // ---------- Handlers ----------
  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.insectID) next.insectID = "กรุณาเลือกแมลงเป้าหมาย";
    if (!form.areaSize.trim()) {
      next.areaSize = "กรุณาระบุขนาดพื้นที่";
    } else if (isNaN(Number(form.areaSize)) || Number(form.areaSize) <= 0) {
      next.areaSize = "กรุณาระบุขนาดพื้นที่เป็นตัวเลขที่มากกว่า 0";
    }
    if (!memberID) next.insectID = "กรุณาเข้าสู่ระบบก่อนใช้งาน";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    try {
      setIsCalculating(true);
      setApiError("");

      const payload = {
        insectID: form.insectID,
        areaSize: Number(form.areaSize),
        areaUnit: form.areaUnit,
        waterPerRai: form.waterPerRai.trim() ? Number(form.waterPerRai) : null,
      };

      const res = await fetch(`${API_ORIGIN}/api/v1/members/${memberID}/calculations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message || body?.error || `เกิดข้อผิดพลาด (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();

      // เก็บผลลัพธ์ใน sessionStorage แล้ว redirect ไปหน้า result
      sessionStorage.setItem("calculation_results", JSON.stringify(data));
      router.push("/member/calculationresult");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiError("");
  };

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-6">
      <div className="max-w-5xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">มันทำงานอย่างไร</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              ระบบคำนวณปริมาณสารเคมีที่เหมาะสมตามอัตราการใช้มาตรฐานสำหรับพื้นที่เพาะปลูกและชนิดศัตรูพืชของคุณ
            </p>
            <ol className="space-y-4">
              {HOW_IT_WORKS_STEPS.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Main form */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h1 className="text-xl font-bold text-gray-900">เครื่องคำนวณปริมาณสารเคมี</h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              เลือกศัตรูพืชที่ระบุและขนาดพื้นที่ของคุณเพื่อรับคำแนะนำเกี่ยวกับสารเคมีที่แม่นยำ
            </p>

            <div className="mt-6 space-y-6">
              {/* Target pest — ดึงจาก API */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  แมลงเป้าหมาย <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.insectID}
                    onChange={(e) => handleChange("insectID", e.target.value)}
                    disabled={insectsLoading || isCalculating}
                    className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {insectsLoading ? "กำลังโหลดรายชื่อแมลง..." : "เลือกประเภทศัตรูพืช..."}
                    </option>
                    {insects.map((ins) => (
                      <option key={ins.insectID} value={ins.insectID}>
                        {ins.insectName}
                      </option>
                    ))}
                  </select>
                  {insectsLoading ? (
                    <Loader2 size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  ) : (
                    <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>
                {errors.insectID && (
                  <p className="mt-1 text-xs text-red-600">{errors.insectID}</p>
                )}
              </div>

              {/* Area size / unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ขนาดพื้นที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="เช่น 5"
                    value={form.areaSize}
                    onChange={(e) => handleChange("areaSize", e.target.value)}
                    disabled={isCalculating}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.areaSize && (
                    <p className="mt-1 text-xs text-red-600">{errors.areaSize}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    หน่วยพื้นที่
                  </label>
                  <div className="relative">
                    <select
                      value={form.areaUnit}
                      onChange={(e) => handleChange("areaUnit", e.target.value)}
                      disabled={isCalculating}
                      className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {AREA_UNIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Water per rai */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  ปริมาณน้ำต่อไร่ (ลิตร)
                  <span className="text-gray-400 font-normal ml-1 text-xs">— จำเป็นสำหรับสารเคมีชนิดพ่น</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="เช่น 60"
                  value={form.waterPerRai}
                  onChange={(e) => handleChange("waterPerRai", e.target.value)}
                  disabled={isCalculating}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.waterPerRai && (
                  <p className="mt-1 text-xs text-red-600">{errors.waterPerRai}</p>
                )}
              </div>

              {/* API Error */}
              {apiError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 text-white text-sm font-semibold py-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCalculating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Calculator size={18} />
                  )}
                  {isCalculating ? "กำลังคำนวณ..." : "คำนวณขนาดยา"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isCalculating}
                  className="px-8 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  ล้าง
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning footer */}
        <div className="mt-4 flex gap-3 px-2">
          <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">ข้อสงวนสิทธิ์:</strong> การคำนวณเป็นการประมาณการโดยอิงจากอัตราการใช้สารเคมีมาตรฐานและข้อมูลทางการเกษตรทั่วไป
            โปรดตรวจสอบปริมาณการใช้กับเจ้าหน้าที่ส่งเสริมการเกษตรในพื้นที่และคำแนะนำของผู้ผลิตสารเคมีก่อนการใช้งานเสมอ
          </p>
        </div>
      </div>
    </div>
  );
}
