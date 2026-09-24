"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlantingRecordFormData {
  fieldName: string; // เปลี่ยนจาก location ให้ตรง DTO
  plantingDate: string; // yyyy-mm-dd (native <input type="date"> format)
  areaRai: number | null;
  areaNgan: number | null;
  areaSqWah: number | null;
}

const EMPTY_FORM: PlantingRecordFormData = {
  fieldName: "",
  plantingDate: "",
  areaRai: null,
  areaNgan: null,
  areaSqWah: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlantingRecordForm() {
  const router = useRouter();

  const [form, setForm] = useState<PlantingRecordFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PlantingRecordFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // อ่าน Cookie ตอน mount สำหรับ initial state
  const [memberID, setMemberID] = useState<string | null>(null);

  useEffect(() => {
    const session = Cookies.get("member_session");
    if (!session) {
      router.push("/member/login");
    } else {
      Promise.resolve().then(() => {
        const member = JSON.parse(session);
        setMemberID(member.memberID);
      });
    }
  }, [router]);

  const handleChange = (field: keyof PlantingRecordFormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "areaRai" || field === "areaNgan" || field === "areaSqWah"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.fieldName.trim())
      next.fieldName = "กรุณาระบุสถานที่ปลูกข้าว (ชื่อแปลง)";
    if (!form.plantingDate) next.plantingDate = "กรุณาระบุวันที่เริ่มปลูกข้าว";

    const rai = form.areaRai || 0;
    const ngan = form.areaNgan || 0;
    const sqwah = form.areaSqWah || 0;

    if (rai === 0 && ngan === 0 && sqwah === 0) {
      next.areaRai = "กรุณาระบุพื้นที่เพาะปลูก";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!memberID) return;

    setApiError(null);
    setIsSubmitting(true);

    try {
      const rai = form.areaRai || 0;
      const ngan = form.areaNgan || 0;
      const sqwah = form.areaSqWah || 0;
      const totalAreaRai = rai + ngan * 0.25 + sqwah * 0.0025;

      const payload = {
        fieldName: form.fieldName,
        plantingDate: form.plantingDate,
        areaSize: Number(totalAreaRai.toFixed(4)),
        areaUnit: "ไร่",
      };

      const res = await fetch(`${API_URL}/api/v1/members/${memberID}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("บันทึกข้อมูลแปลงข้าวไม่สำเร็จ");
      }

      router.push("/member/dashboard");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F1] flex items-start justify-center p-6 pt-12">
      <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            บันทึกการปลูกใหม่
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            บันทึกข้อมูลการปลูกในรอบปัจจุบันเพื่อนำไปใช้ในการวิเคราะห์และประมวลผลข้อมูลต่อไปเพื่อสนับสนุนการใช้งานและการติดตามผลผลิตอย่างมีประสิทธิภาพ
          </p>
        </div>

        {apiError && (
          <div className="mx-8 mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {apiError}
          </div>
        )}

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Location / Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชื่อแปลง / สถานที่ปลูกข้าว
              </label>
              <input
                type="text"
                value={form.fieldName}
                onChange={(e) => handleChange("fieldName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="เช่น แปลงหลังบ้าน"
                disabled={isSubmitting}
              />
              {errors.fieldName && (
                <p className="mt-1 text-xs text-red-600">{errors.fieldName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                วันที่เริ่มปลูกข้าว
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.plantingDate}
                  onChange={(e) => handleChange("plantingDate", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:light]"
                />
                <Calendar
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.plantingDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.plantingDate}
                </p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Cultivated area */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">
              CULTIVATED AREA (พื้นที่เพาะปลูก)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ไร่ (RAI)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.areaRai ?? ""}
                  onChange={(e) => handleChange("areaRai", e.target.value)}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors.areaRai && (
                  <p className="mt-1 text-xs text-red-600">{errors.areaRai}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  งาน (NGAN)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.areaNgan ?? ""}
                  onChange={(e) => handleChange("areaNgan", e.target.value)}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ตารางวา (SQ. WAH)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.areaSqWah ?? ""}
                  onChange={(e) => handleChange("areaSqWah", e.target.value)}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              * ระบบจะนำ ไร่, งาน, ตารางวา
              มารวมกันเพื่อคำนวณปริมาณสารเคมีแบบอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-8 py-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/member/dashboard")}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
