'use client';

import { useState, useEffect, useMemo, useRef, useSyncExternalStore, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Loader2, Lock, Info, MapPin, AlertCircle, ChevronLeft } from 'lucide-react';
import Cookies from 'js-cookie';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface InsectOption {
  insectID: string;
  insectName: string;
}

interface RiceFieldOption {
  fieldID: string;
  fieldName: string;
  areaRai?: number | null;
  areaNgan?: number | null;
  areaSqWah?: number | null;
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
  waterPerRai: '60',
};

const emptySubscribe = () => () => {};

// ตัวเลขเท่านั้น: ตัวเลข 0-9 และทศนิยมได้ (ไม่รับเครื่องหมาย, เว้นวรรค, ตัวอักษร, รูปแบบ e)
const NUMERIC_PATTERN = /^(\d+(\.\d+)?|\.\d+)$/;

// ตรวจค่า string ที่ผู้ใช้กรอกโดยตรง (ไม่ trim และไม่แปลงเป็น Number ก่อนตรวจ)
// คืนค่าข้อความ Error หรือ '' เมื่อผ่าน
const validateNumericText = (value: string, label: string, emptyHint = ''): string => {
  if (value === '') return `กรุณากรอก${label}${emptyHint}`;
  if (/\s/.test(value)) return `${label}ห้ามมีช่องว่างหรือเว้นวรรค`;
  if (!NUMERIC_PATTERN.test(value)) return `${label}ต้องเป็นตัวเลขเท่านั้น`;
  return '';
};

// ตรวจช่องพื้นที่ (areaRai, areaNgan, areaSqWah): รับเฉพาะจำนวนเต็มไม่ติดลบ (ไม่รับทศนิยม, ช่องว่าง หรือตัวอักษร)
const validateOptionalIntegerText = (value: string, label: string): string => {
  if (value === '') return '';
  if (/\s/.test(value)) return `${label}ห้ามมีช่องว่างหรือเว้นวรรค`;
  if (!/^\d+$/.test(value)) return `${label}ต้องเป็นตัวเลขจำนวนเต็มไม่ติดลบเท่านั้น`;
  return '';
};

// ช่องว่างตีความเป็น 0 (ใช้เฉพาะตอนตรวจพื้นที่รวมและสร้าง payload)
const areaToNumber = (value: string): number => (value === '' ? 0 : Number(value));

function ChemicalCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramInsectID = searchParams.get('insectID');
  const paramFieldID = searchParams.get('fieldID');
  const paramSource = searchParams.get('source');

  // ตรวจสอบที่มา: ล็อกชนิดแมลงเฉพาะกรณีที่มาจากผลวิเคราะห์แมลงจริงเท่านั้น
  const isFromAnalysis = paramSource === 'analysis' && Boolean(paramInsectID);

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

  const [fields, setFields] = useState<RiceFieldOption[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [selectedFieldID, setSelectedFieldID] = useState<string>('');

  const [fieldAutoFilled, setFieldAutoFilled] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [apiError, setApiError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const isCalculatingRef = useRef(false);

  // 1. โหลดรายชื่อแมลงทั้งหมด
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

  const [prevMemberID, setPrevMemberID] = useState(memberID);
  if (memberID !== prevMemberID) {
    setPrevMemberID(memberID);
    setFields([]);
    setSelectedFieldID('');
    setFieldAutoFilled(false);
    setFieldError('');
    setFieldsLoading(Boolean(memberID));
  }

  // 2. โหลดรายการแปลงนาของสมาชิก และ Auto-fill แปลงเมื่อมี fieldID
  useEffect(() => {
    if (!memberID) {
      return;
    }

    const controller = new AbortController();

    async function loadFields() {
      try {
        setFieldError('');
        const res = await fetch(
          `${API_ORIGIN}/api/v1/members/${memberID}/fields`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;

        if (!res.ok) {
          if (paramFieldID) {
            setFieldError('ไม่สามารถโหลดข้อมูลแปลงนาได้');
          }
          return;
        }

        const data: RiceFieldOption[] = await res.json();
        if (controller.signal.aborted) return;
        const fieldList = Array.isArray(data) ? data : [];
        setFields(fieldList);

        // Auto-fill แปลงนาเมื่อมี paramFieldID
        if (paramFieldID) {
          const matched = fieldList.find((f) => f.fieldID === paramFieldID);
          if (matched) {
            setSelectedFieldID(matched.fieldID);
            setForm((prev) => ({
              ...prev,
              areaRai: matched.areaRai != null ? String(matched.areaRai) : '',
              areaNgan: matched.areaNgan != null ? String(matched.areaNgan) : '',
              areaSqWah: matched.areaSqWah != null ? String(matched.areaSqWah) : '',
            }));
            setFieldAutoFilled(true);
            setFieldError('');
          } else {
            // หากไม่พบแปลง ห้ามแสดงแปลงอื่นแทน
            setFieldError('ไม่พบข้อมูลแปลงนาที่ระบุ หรือแปลงนานี้อาจถูกลบไปแล้ว');
            setSelectedFieldID('');
            setFieldAutoFilled(false);
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          if (paramFieldID) {
            setFieldError('เกิดข้อผิดพลาดในการโหลดข้อมูลแปลงนา');
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setFieldsLoading(false);
        }
      }
    }

    loadFields();
    return () => {
      controller.abort();
    };
  }, [memberID, paramFieldID]);

  // ค้นหาข้อมูลแปลงนาที่กำลังเลือกอยู่
  const currentSelectedField = useMemo(() => {
    return fields.find((f) => f.fieldID === selectedFieldID) || null;
  }, [fields, selectedFieldID]);

  // เมื่อผู้ใช้เลือกแปลงนาจาก Select Dropdown
  const handleFieldChange = (newFieldID: string) => {
    setSelectedFieldID(newFieldID);
    setFieldError('');
    if (apiError) setApiError('');

    if (!newFieldID) {
      setFieldAutoFilled(false);
      return;
    }

    const matched = fields.find((f) => f.fieldID === newFieldID);
    if (matched) {
      setForm((prev) => ({
        ...prev,
        areaRai: matched.areaRai != null ? String(matched.areaRai) : '',
        areaNgan: matched.areaNgan != null ? String(matched.areaNgan) : '',
        areaSqWah: matched.areaSqWah != null ? String(matched.areaSqWah) : '',
      }));
      setFieldAutoFilled(true);

      // เคลียร์ error ของพื้นที่หากมี
      setErrors((prev) => {
        const next = { ...prev };
        delete next.areaRai;
        delete next.areaNgan;
        delete next.areaSqWah;
        return next;
      });
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (apiError) setApiError('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === 'areaRai' || field === 'areaNgan' || field === 'areaSqWah') {
        if (next.areaRai === 'กรุณาระบุขนาดพื้นที่อย่างน้อย 1 หน่วย') {
          delete next.areaRai;
        }
      }
      return next;
    });
  };

  const validate = (): boolean => {
    if (!memberID) {
      setApiError('กรุณาเข้าสู่ระบบก่อนใช้งานการคำนวณ');
      return false;
    }

    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.insectID) next.insectID = 'กรุณาเลือกชนิดแมลงศัตรูข้าวเป้าหมาย';

    // ช่องพื้นที่เว้นว่างได้ แต่ถ้ากรอกต้องเป็นตัวเลขจำนวนเต็มไม่ติดลบเท่านั้น (ห้ามทศนิยมและ whitespace)
    const raiError = validateOptionalIntegerText(form.areaRai, 'จำนวนไร่');
    const nganError = validateOptionalIntegerText(form.areaNgan, 'จำนวนงาน');
    const sqwahError = validateOptionalIntegerText(form.areaSqWah, 'จำนวนตารางวา');

    if (raiError) next.areaRai = raiError;
    if (nganError) next.areaNgan = nganError;
    if (sqwahError) next.areaSqWah = sqwahError;

    // ตรวจสอบช่วงค่าของ งาน (0-3) และ ตารางวา (0-99)
    if (!nganError && form.areaNgan !== '') {
      const nganVal = parseInt(form.areaNgan, 10);
      if (nganVal > 3) {
        next.areaNgan = 'จำนวนงานต้องอยู่ระหว่าง 0–3';
      }
    }

    if (!sqwahError && form.areaSqWah !== '') {
      const sqwahVal = parseInt(form.areaSqWah, 10);
      if (sqwahVal > 99) {
        next.areaSqWah = 'จำนวนตารางวาต้องอยู่ระหว่าง 0–99';
      }
    }

    // พื้นที่รวมต้องมากกว่า 0 (ตรวจเมื่อทั้ง 3 ช่องไม่มี error)
    if (!next.areaRai && !next.areaNgan && !next.areaSqWah) {
      const rai = areaToNumber(form.areaRai);
      const ngan = areaToNumber(form.areaNgan);
      const sqwah = areaToNumber(form.areaSqWah);

      if (rai === 0 && ngan === 0 && sqwah === 0) {
        next.areaRai = 'กรุณาระบุขนาดพื้นที่อย่างน้อย 1 หน่วย';
      }
    }

    const waterError = validateNumericText(form.waterPerRai, 'ปริมาณน้ำที่ใช้ต่อไร่');
    if (waterError) {
      next.waterPerRai = waterError;
    } else if (Number(form.waterPerRai) <= 0) {
      // กติกาเดิม: ปริมาณน้ำต้องมากกว่า 0
      next.waterPerRai = 'กรุณาระบุปริมาณน้ำเป็นตัวเลขที่มากกว่า 0';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCalculate = async () => {
    if (isCalculatingRef.current || isCalculating) return;

    if (!validate()) return;

    try {
      isCalculatingRef.current = true;
      setIsCalculating(true);
      setApiError('');

      const rai = form.areaRai ? parseInt(form.areaRai, 10) : 0;
      const ngan = form.areaNgan ? parseInt(form.areaNgan, 10) : 0;
      const sqwah = form.areaSqWah ? parseInt(form.areaSqWah, 10) : 0;

      const payload = {
        insectID: form.insectID,
        areaRai: rai,
        areaNgan: ngan,
        areaSqWah: sqwah,
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
      isCalculatingRef.current = false;
      setIsCalculating(false);
    }
  };

  const handleClear = () => {
    if (isFromAnalysis && paramInsectID) {
      // โหมดมาจากผลวิเคราะห์ ให้คงแมลงที่ล็อกไว้ตามเดิม
      setForm({
        ...EMPTY_FORM,
        insectID: paramInsectID,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setSelectedFieldID('');
    setFieldAutoFilled(false);
    setFieldError('');
    setErrors({});
    setApiError('');
    isCalculatingRef.current = false;
    setIsCalculating(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-2xl mx-auto px-6 pt-8">
        {/* Back Link & Page Header */}
        <div className="mb-6">
          <Link
            href="/member/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A635D] hover:text-[#111813] transition-colors mb-3"
          >
            <ChevronLeft size={14} />
            <span>กลับไปแดชบอร์ด</span>
          </Link>
          <div className="pb-4 border-b border-[#E3E6E4]">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
              คำนวณปริมาณสารเคมีและอัตราผสม
            </h1>
            <p className="text-sm text-[#5A635D] mt-1">
              คำนวณปริมาณสารเคมี อัตราการผสมต่อน้ำ และคำแนะนำการใช้ตามขนาดแปลงนาจริง
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-bold tracking-tight text-[#1A1F1C]">
              ข้อมูลศัตรูพืชและขนาดพื้นที่แปลงนา
            </h2>
            <p className="text-xs text-[#5A635D] mt-0.5">
              เลือกชนิดศัตรูพืชและระบุขนาดแปลงนาเพื่อรับคำแนะนำปริมาณสารเคมีอย่างแม่นยำ
            </p>
          </div>

          {fieldError && (
            <div className="mb-6 p-3.5 rounded-md bg-[#FDECEA] border border-[#F4B9B3] text-[#B42318] text-xs">
              {fieldError}
            </div>
          )}

          {fieldAutoFilled && !fieldError && !apiError && (
            <div className="mb-6 p-3.5 rounded-md bg-[#E8F5EC] border border-[#B7DFC6] text-[#1E7B45] text-xs">
              {isFromAnalysis && paramFieldID
                ? 'ระบบดึงข้อมูลแปลงนาและขนาดพื้นที่จริงจากผลวิเคราะห์ของคุณเรียบร้อยแล้ว'
                : 'ระบบดึงข้อมูลพื้นที่จากแปลงนาที่คุณเลือกเรียบร้อยแล้ว'}
            </div>
          )}

          <div className="space-y-5">
            {/* Pest Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1A1F1C]">
                  แมลงศัตรูข้าวเป้าหมาย <span className="text-[#B42318]">*</span>
                </label>
                {isFromAnalysis && (
                  <span className="text-[11px] font-medium text-[#2D7048] bg-[#E8F5EC] border border-[#B7DFC6] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Lock size={11} />
                    <span>ล็อกตามผลวิเคราะห์ AI</span>
                  </span>
                )}
              </div>
              <select
                value={form.insectID}
                onChange={(e) => handleChange('insectID', e.target.value)}
                disabled={insectsLoading || isCalculating || isFromAnalysis}
                className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2] disabled:text-[#5A635D] disabled:cursor-not-allowed"
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
              {isFromAnalysis && (
                <p className="mt-1 text-xs text-[#5A635D]">
                  ชนิดแมลงถูกระบุจากผลการวิเคราะห์ภาพถ่าย หากต้องการคำนวณแมลงชนิดอื่น กรุณาเข้าสู่เมนูคำนวณโดยตรง
                </p>
              )}
              {errors.insectID && (
                <p className="mt-1 text-xs text-[#B42318]">{errors.insectID}</p>
              )}
            </div>

            {/* Field Select */}
            <div className="pt-2 border-t border-[#E3E6E4]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1A1F1C]">
                  แปลงนาข้าว <span className="text-xs font-normal text-[#5A635D]">(ทางเลือก)</span>
                </label>
                {isFromAnalysis && paramFieldID && currentSelectedField && (
                  <span className="text-[11px] font-medium text-[#1E7B45] bg-[#E8F5EC] border border-[#B7DFC6] px-2 py-0.5 rounded-full">
                    ดึงข้อมูลจากผลวิเคราะห์
                  </span>
                )}
              </div>
              <select
                value={selectedFieldID}
                onChange={(e) => handleFieldChange(e.target.value)}
                disabled={fieldsLoading || isCalculating}
                className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
              >
                <option value="">
                  {fieldsLoading
                    ? 'กำลังโหลดข้อมูลแปลงนา...'
                    : !memberID
                    ? '— เข้าสู่ระบบเพื่อเลือกแปลงนาของคุณ —'
                    : '— ไม่เลือกแปลงนา (ระบุพื้นที่เอง) —'}
                </option>
                {fields.map((f) => {
                  const areaParts = [
                    f.areaRai != null ? `${f.areaRai} ไร่` : '',
                    f.areaNgan != null ? `${f.areaNgan} งาน` : '',
                    f.areaSqWah != null ? `${f.areaSqWah} ตร.ว.` : '',
                  ].filter(Boolean);
                  const areaText = areaParts.length > 0 ? areaParts.join(' ') : '0 ไร่';
                  return (
                    <option key={f.fieldID} value={f.fieldID}>
                      {f.fieldName} ({areaText})
                    </option>
                  );
                })}
              </select>

              {/* ข้อมูลแปลงนาที่เลือกและขนาดพื้นที่จริง */}
              {currentSelectedField && (
                <div className="mt-3 p-3.5 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={14} className="text-[#2D7048] shrink-0" />
                      <span className="text-[#5A635D] shrink-0">แปลงที่เลือก:</span>
                      <span className="font-semibold text-[#1A1F1C] truncate">{currentSelectedField.fieldName}</span>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[#5A635D]">ขนาดพื้นที่จริง: </span>
                      <span className="font-bold text-[#2D7048]">
                        {[
                          currentSelectedField.areaRai != null ? `${currentSelectedField.areaRai} ไร่` : '',
                          currentSelectedField.areaNgan != null ? `${currentSelectedField.areaNgan} งาน` : '',
                          currentSelectedField.areaSqWah != null ? `${currentSelectedField.areaSqWah} ตร.ว.` : '',
                        ].filter(Boolean).join(' ') || '0 ไร่'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#5A635D]">
                    <Info size={12} className="text-[#2D7048] shrink-0" />
                    <span>ระบบใส่ขนาดพื้นที่จริงลงในแบบฟอร์มด้านล่างเพื่อนำไปคำนวณปริมาณสารเคมีอัตโนมัติ</span>
                  </div>
                </div>
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
                    type="text"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value={form.areaRai}
                    onChange={(e) => handleChange('areaRai', e.target.value)}
                    disabled={isCalculating}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                  />
                  {errors.areaRai && (
                    <p className="mt-1.5 text-xs text-[#B42318]">{errors.areaRai}</p>
                  )}
                </div>
                <div>
                  <span className="block text-xs text-[#5A635D] mb-1">งาน</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    min="0"
                    max="3"
                    placeholder="0"
                    value={form.areaNgan}
                    onChange={(e) => handleChange('areaNgan', e.target.value)}
                    disabled={isCalculating}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                  />
                  {errors.areaNgan && (
                    <p className="mt-1.5 text-xs text-[#B42318]">{errors.areaNgan}</p>
                  )}
                </div>
                <div>
                  <span className="block text-xs text-[#5A635D] mb-1">ตารางวา</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    min="0"
                    max="99"
                    placeholder="0"
                    value={form.areaSqWah}
                    onChange={(e) => handleChange('areaSqWah', e.target.value)}
                    disabled={isCalculating}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                  />
                  {errors.areaSqWah && (
                    <p className="mt-1.5 text-xs text-[#B42318]">{errors.areaSqWah}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Water Volume */}
            <div className="pt-2 border-t border-[#E3E6E4]">
              <label className="block text-sm font-medium text-[#1A1F1C] mb-1">
                ปริมาณน้ำที่ใช้ต่อไร่ (ลิตร) <span className="text-[#B42318]">*</span>
                <span className="text-[#5A635D] font-normal ml-1 text-xs">
                  — สำหรับสารเคมีชนิดพ่นทางใบ
                </span>
              </label>
              <input
                type="text"
                inputMode="decimal"
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

            {/* API Error Feedback Banner */}
            {apiError && (
              <div className="p-4 rounded-md bg-[#FDECEA] border border-[#F4B9B3] flex items-center justify-between gap-3 text-[#B42318] text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{apiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError('')}
                  className="text-xs text-[#B42318] hover:underline cursor-pointer shrink-0"
                >
                  ปิด
                </button>
              </div>
            )}

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