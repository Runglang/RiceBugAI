'use client';

import { useState, useEffect, useMemo, useSyncExternalStore, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calculator, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface InsectOption {
  insectID: string;
  insectName: string;
}

interface FormData {
  insectID: string;
  areaRai: string;
  areaNgan: string;
  areaSqWah: string;
  waterPerRai: string;
}

const EMPTY_FORM: FormData = {
  insectID: '',
  areaRai: '',
  areaNgan: '',
  areaSqWah: '',
  waterPerRai: '',
};

const emptySubscribe = () => () => {};

function ChemicalCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramInsectID = searchParams.get('insectID');
  const paramFieldID = searchParams.get('fieldID');

  const sessionCookie = useSyncExternalStore(
    emptySubscribe,
    () => Cookies.get('member_session') ?? null,
    () => null
  );

  const memberID = useMemo(() => {
    if (!sessionCookie) return null;
    try {
      const parsed = JSON.parse(sessionCookie);
      return parsed.memberID ?? null;
    } catch {
      return null;
    }
  }, [sessionCookie]);

  const [insects, setInsects] = useState<InsectOption[]>([]);
  const [insectsLoading, setInsectsLoading] = useState(true);
  const [fieldAutoFilled, setFieldAutoFilled] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [apiError, setApiError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInsects() {
      try {
        const res = await fetch(`${API_ORIGIN}/api/v1/insects`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error('โหลดรายชื่อแมลงไม่สำเร็จ');
        const data: InsectOption[] = await res.json();
        if (controller.signal.aborted) return;
        const insectList = Array.isArray(data) ? data : [];
        setInsects(insectList);

        // Auto-select insect if insectID is passed via URL
        if (paramInsectID && insectList.some((ins) => ins.insectID === paramInsectID)) {
          setForm((prev) => ({ ...prev, insectID: paramInsectID }));
        }
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
    return () => {
      controller.abort();
    };
  }, [paramInsectID]);

  // Auto-fill area from Field when fieldID is passed via URL
  useEffect(() => {
    if (!paramFieldID || !memberID) return;

    const controller = new AbortController();

    async function loadFieldArea() {
      try {
        setFieldError('');
        const res = await fetch(
          `${API_ORIGIN}/api/v1/members/${memberID}/fields`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;

        if (!res.ok) {
          setFieldError('ไม่สามารถโหลดข้อมูลแปลงนาได้');
          return;
        }

        const fields: Array<{
          fieldID: string;
          fieldName: string;
          areaRai?: number | null;
          areaNgan?: number | null;
          areaSqWah?: number | null;
        }> = await res.json();
        if (controller.signal.aborted) return;

        const matched = fields.find((f) => f.fieldID === paramFieldID);
        if (!matched) {
          setFieldError('ไม่พบข้อมูลแปลงนาที่เลือก');
          return;
        }

        setForm((prev) => ({
          ...prev,
          areaRai: matched.areaRai != null ? String(matched.areaRai) : '',
          areaNgan: matched.areaNgan != null ? String(matched.areaNgan) : '',
          areaSqWah: matched.areaSqWah != null ? String(matched.areaSqWah) : '',
        }));
        setFieldAutoFilled(true);
      } catch {
        if (!controller.signal.aborted) {
          setFieldError('เกิดข้อผิดพลาดในการโหลดข้อมูลแปลงนา');
        }
      }
    }

    loadFieldArea();
    return () => {
      controller.abort();
    };
  }, [paramFieldID, memberID]);

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
    if (!form.insectID) next.insectID = 'กรุณาเลือกชนิดแมลงศัตรูข้าวเป้าหมาย';

    const rai = Number(form.areaRai) || 0;
    const ngan = Number(form.areaNgan) || 0;
    const sqwah = Number(form.areaSqWah) || 0;

    if (rai === 0 && ngan === 0 && sqwah === 0) {
      next.areaRai = 'กรุณาระบุขนาดพื้นที่อย่างน้อย 1 หน่วย';
    }

    if (!memberID) next.insectID = 'กรุณาเข้าสู่ระบบก่อนใช้งานการคำนวณ';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    try {
      setIsCalculating(true);
      setApiError('');

      const rai = Number(form.areaRai) || 0;
      const ngan = Number(form.areaNgan) || 0;
      const sqwah = Number(form.areaSqWah) || 0;

      const payload = {
        insectID: form.insectID,
        areaRai: Math.floor(rai),
        areaNgan: Math.floor(ngan),
        areaSqWah: Math.floor(sqwah),
        waterPerRai: form.waterPerRai.trim() ? Number(form.waterPerRai) : null,
      };

      const res = await fetch(`${API_ORIGIN}/api/v1/members/${memberID}/calculations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message || body?.error || `เกิดข้อผิดพลาด (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();
      sessionStorage.setItem('calculation_results', JSON.stringify(data));
      router.push('/member/calculationresult');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiError('');
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Sidebar Info */}
          <div className="md:col-span-4 bg-white border border-[#E3E6E4] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#1A1F1C]">หลักการคำนวณปริมาณสารเคมี</h2>
            <p className="text-xs text-[#5A635D] leading-relaxed">
              ระบบจะอิงตามอัตราการใช้สารเคมีที่ขึ้นทะเบียนต่อพื้นที่ 1 ไร่ เพื่อป้องกันปัญหาการสะสมสารพิษเกินขนาด
              หรือการดื้อยาของแมลงศัตรูพืช
            </p>

            <div className="pt-3 border-t border-[#E3E6E4] space-y-2.5 text-xs text-[#3F4742]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E8F5EC] text-[#1E7B45] text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>ระบุแมลงศัตรูพืชที่ตรวจพบ</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E8F5EC] text-[#1E7B45] text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>ระบุขนาดพื้นที่ระบาดจริง</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E8F5EC] text-[#1E7B45] text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>รับสูตรผสมและปริมาณน้ำที่ต้องใช้</span>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="md:col-span-8 bg-white border border-[#E3E6E4] rounded-lg p-6 sm:p-7">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-[#1A1F1C]">
                คำนวณปริมาณสารเคมีและอัตราผสม
              </h1>
              <p className="text-sm text-[#5A635D] mt-1">
                เลือกชนิดศัตรูพืชและระบุขนาดแปลงนาเพื่อรับคำแนะนำปริมาณสารเคมีอย่างแม่นยำ
              </p>
            </div>

            {apiError && (
              <div className="mb-6 p-3.5 rounded-md bg-[#FDECEA] border border-[#F4B9B3] text-[#B42318] text-xs">
                {apiError}
              </div>
            )}

            {fieldError && (
              <div className="mb-6 p-3.5 rounded-md bg-[#FDECEA] border border-[#F4B9B3] text-[#B42318] text-xs">
                {fieldError}
              </div>
            )}

            {fieldAutoFilled && !fieldError && (
              <div className="mb-6 p-3.5 rounded-md bg-[#E8F5EC] border border-[#B7DFC6] text-[#1E7B45] text-xs">
                ระบบดึงข้อมูลพื้นที่จากแปลงนาของคุณเรียบร้อยแล้ว
              </div>
            )}

            <div className="space-y-5">
              {/* Pest Select */}
              <div>
                <label className="block text-sm font-medium text-[#1A1F1C] mb-1.5">
                  แมลงศัตรูข้าวเป้าหมาย <span className="text-[#B42318]">*</span>
                </label>
                <select
                  value={form.insectID}
                  onChange={(e) => handleChange('insectID', e.target.value)}
                  disabled={insectsLoading || isCalculating}
                  className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
                >
                  <option value="">
                    {insectsLoading ? 'กำลังโหลดรายชื่อแมลง...' : '— เลือกชนิดแมลงศัตรูพืช —'}
                  </option>
                  {insects.map((ins) => (
                    <option key={ins.insectID} value={ins.insectID}>
                      {ins.insectName}
                    </option>
                  ))}
                </select>
                {errors.insectID && (
                  <p className="mt-1 text-xs text-[#B42318]">{errors.insectID}</p>
                )}
              </div>

              {/* Cultivated Area */}
              <div className="pt-2 border-t border-[#E3E6E4]">
                <label className="block text-sm font-medium text-[#1A1F1C] mb-1">
                  ขนาดพื้นที่ระบาด <span className="text-[#B42318]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-xs text-[#5A635D] mb-1">ไร่</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.areaRai}
                      onChange={(e) => handleChange('areaRai', e.target.value)}
                      disabled={isCalculating}
                      className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                    />
                  </div>
                  <div>
                    <span className="block text-xs text-[#5A635D] mb-1">งาน</span>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      placeholder="0"
                      value={form.areaNgan}
                      onChange={(e) => handleChange('areaNgan', e.target.value)}
                      disabled={isCalculating}
                      className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                    />
                  </div>
                  <div>
                    <span className="block text-xs text-[#5A635D] mb-1">ตารางวา</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={form.areaSqWah}
                      onChange={(e) => handleChange('areaSqWah', e.target.value)}
                      disabled={isCalculating}
                      className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                    />
                  </div>
                </div>
                {errors.areaRai && (
                  <p className="mt-1.5 text-xs text-[#B42318]">{errors.areaRai}</p>
                )}
              </div>

              {/* Water Volume */}
              <div className="pt-2 border-t border-[#E3E6E4]">
                <label className="block text-sm font-medium text-[#1A1F1C] mb-1">
                  ปริมาณน้ำที่ใช้ต่อไร่ (ลิตร)
                  <span className="text-[#5A635D] font-normal ml-1 text-xs">
                    — สำหรับสารเคมีชนิดพ่นทางใบ
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="ค่ามาตรฐานทั่วไป เช่น 60 ลิตร/ไร่"
                  value={form.waterPerRai}
                  onChange={(e) => handleChange('waterPerRai', e.target.value)}
                  disabled={isCalculating}
                  className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                />
                {errors.waterPerRai && (
                  <p className="mt-1 text-xs text-[#B42318]">{errors.waterPerRai}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-[#E3E6E4] flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="flex-1 h-10 px-4 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังประมวลผลการคำนวณ...</span>
                    </>
                  ) : (
                    <>
                      <Calculator size={16} />
                      <span>คำนวณปริมาณสารเคมี</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isCalculating}
                  className="h-10 px-4 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium rounded-md transition-colors cursor-pointer"
                >
                  ล้างข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChemicalCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F7] py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
          <Loader2 className="animate-spin text-[#2D7048]" size={24} />
          <span>กำลังโหลดเครื่องมือคำนวณ...</span>
        </div>
      }
    >
      <ChemicalCalculatorContent />
    </Suspense>
  );
}
