'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Loader2, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { getProvinces, getDistricts, getSubdistricts } from '@/app/data/thai_address';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface PlantingRecordFormData {
  fieldName: string;
  plantingDate: string;
  areaRai: number | null;
  areaNgan: number | null;
  areaSqWah: number | null;
  province: string;
  district: string;
  subdistrict: string;
}

const EMPTY_FORM: PlantingRecordFormData = {
  fieldName: '',
  plantingDate: '',
  areaRai: null,
  areaNgan: null,
  areaSqWah: null,
  province: '',
  district: '',
  subdistrict: '',
};

const emptySubscribe = () => () => {};

export default function PlantingRecordForm() {
  const router = useRouter();

  const [form, setForm] = useState<PlantingRecordFormData>(EMPTY_FORM);
  const [areaText, setAreaText] = useState({ areaRai: '', areaNgan: '', areaSqWah: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof PlantingRecordFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sessionCookie = useSyncExternalStore(
    emptySubscribe,
    () => Cookies.get('member_session') ?? null,
    () => null
  );

  const memberID = useMemo(() => {
    if (!sessionCookie) return null;
    try {
      const member = JSON.parse(sessionCookie);
      return member?.memberID ?? null;
    } catch {
      return null;
    }
  }, [sessionCookie]);

  const provinces = useMemo(() => getProvinces(), []);
  const districts = useMemo(() => getDistricts(form.province), [form.province]);
  const subdistricts = useMemo(() => getSubdistricts(form.province, form.district), [form.province, form.district]);

  useEffect(() => {
    const session = Cookies.get('member_session');
    if (!session) {
      router.push('/member/login');
      return;
    }
    try {
      const member = JSON.parse(session);
      if (!member?.memberID) {
        router.push('/member/login');
      }
    } catch {
      router.push('/member/login');
    }
  }, [router]);

  const handleFieldChange = (field: keyof PlantingRecordFormData, value: string) => {
    setSuccessMessage(null);
    setApiError(null);
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAreaChange = (field: 'areaRai' | 'areaNgan' | 'areaSqWah', value: string) => {
    setSuccessMessage(null);
    setApiError(null);
    setAreaText((prev) => ({ ...prev, [field]: value }));
    setForm((prev) => ({
      ...prev,
      [field]: /^\d+$/.test(value) ? parseInt(value, 10) : null,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (next.areaRai === 'กรุณาระบุขนาดพื้นที่อย่างน้อย 1 หน่วย') {
        delete next.areaRai;
      }
      return next;
    });
  };

  const handleProvinceChange = (province: string) => {
    setSuccessMessage(null);
    setApiError(null);
    setForm((prev) => ({
      ...prev,
      province,
      district: '',
      subdistrict: '',
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.province;
      delete next.district;
      delete next.subdistrict;
      return next;
    });
  };

  const handleDistrictChange = (district: string) => {
    setSuccessMessage(null);
    setApiError(null);
    setForm((prev) => ({
      ...prev,
      district,
      subdistrict: '',
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.district;
      delete next.subdistrict;
      return next;
    });
  };

  const handleSubdistrictChange = (subdistrict: string) => {
    setSuccessMessage(null);
    setApiError(null);
    setForm((prev) => ({
      ...prev,
      subdistrict,
    }));
    if (errors.subdistrict) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.subdistrict;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof PlantingRecordFormData, string>> = {};

    const name = form.fieldName;
    if (name.trim() === '') {
      next.fieldName = 'กรุณาระบุชื่อแปลงหรือสถานที่ปลูกข้าว';
    } else if (/\s/.test(name)) {
      next.fieldName = 'ชื่อแปลงห้ามมีช่องว่าง';
    } else if (name.length < 3 || name.length > 20) {
      next.fieldName = 'ชื่อแปลงต้องมีความยาว 3–20 ตัวอักษร';
    } else if (!/^[A-Za-z0-9\u0E01-\u0E3A\u0E40-\u0E4E]+$/.test(name)) {
      next.fieldName = 'ชื่อแปลงใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ภาษาไทย และตัวเลข';
    }

    if (!form.plantingDate) {
      next.plantingDate = 'กรุณาระบุวันที่เริ่มปลูกข้าว';
    } else {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (form.plantingDate > todayStr) {
        next.plantingDate = 'วันที่เริ่มปลูกข้าวต้องไม่เป็นวันที่ในอนาคต';
      }
    }

    (
      [
        ['areaRai', 'ไร่'],
        ['areaNgan', 'งาน'],
        ['areaSqWah', 'ตารางวา'],
      ] as const
    ).forEach(([key, label]) => {
      const v = areaText[key];
      if (v === '') {
        return; // ปล่อยว่างได้ (Payload ส่งเป็น 0 ตามเดิม)
      }
      if (/\s/.test(v)) {
        next[key] = `${label}ห้ามมีช่องว่าง`;
      } else if (!/^\d+$/.test(v)) {
        next[key] = `${label}ต้องเป็นตัวเลขจำนวนเต็มไม่ติดลบเท่านั้น`;
      }
    });

    if (!next.areaNgan && areaText.areaNgan !== '') {
      const nganVal = parseInt(areaText.areaNgan, 10);
      if (nganVal > 3) {
        next.areaNgan = 'งานต้องอยู่ระหว่าง 0–3';
      }
    }

    if (!next.areaSqWah && areaText.areaSqWah !== '') {
      const sqwahVal = parseInt(areaText.areaSqWah, 10);
      if (sqwahVal > 99) {
        next.areaSqWah = 'ตารางวาต้องอยู่ระหว่าง 0–99';
      }
    }

    if (!next.areaRai && !next.areaNgan && !next.areaSqWah) {
      const r = form.areaRai ?? 0;
      const n = form.areaNgan ?? 0;
      const w = form.areaSqWah ?? 0;
      if (r === 0 && n === 0 && w === 0) {
        next.areaRai = 'กรุณาระบุขนาดพื้นที่อย่างน้อย 1 หน่วย';
      }
    }

    if (!form.province) {
      next.province = 'กรุณาเลือกจังหวัดที่ตั้งแปลงนา';
    }
    if (!form.district) {
      next.district = 'กรุณาเลือกอำเภอ/เขตที่ตั้งแปลงนา';
    }
    if (!form.subdistrict) {
      next.subdistrict = 'กรุณาเลือกตำบล/แขวงที่ตั้งแปลงนา';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!memberID) return;

    setApiError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        fieldName: form.fieldName.trim(),
        plantingDate: form.plantingDate,
        areaRai: form.areaRai ? Math.floor(form.areaRai) : 0,
        areaNgan: form.areaNgan ? Math.floor(form.areaNgan) : 0,
        areaSqWah: form.areaSqWah ? Math.floor(form.areaSqWah) : 0,
        province: form.province,
        district: form.district,
        subdistrict: form.subdistrict,
      };

      const res = await fetch(`${API_URL}/api/v1/members/${memberID}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('บันทึกข้อมูลแปลงข้าวไม่สำเร็จ (กรุณาตรวจสอบข้อมูลอีกครั้ง)');
      }

      setSuccessMessage('ลงทะเบียนแปลงนาใหม่เรียบร้อยแล้ว');
      setForm(EMPTY_FORM);
      setAreaText({ areaRai: '', areaNgan: '', areaSqWah: '' });
      setErrors({});
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-2xl mx-auto px-6 pt-8">

        {/* Main Form Card */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1F1C]">
              ลงทะเบียนแปลงนาใหม่
            </h1>
            <p className="text-sm text-[#5A635D] mt-1">
              บันทึกข้อมูลแปลงเพาะปลูก ที่ตั้ง และขนาดพื้นที่เพื่อใช้ในการติดตามอายุข้าวและการคำนวณสารเคมี
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Field 1: Field Name */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F1C] mb-1.5">
                ชื่อแปลง / สถานที่ปลูกข้าว <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={form.fieldName}
                onChange={(e) => handleFieldChange('fieldName', e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
                placeholder="เช่น แปลงนาเหนือ"
                disabled={isSubmitting}
              />
              {errors.fieldName && (
                <p className="mt-1 text-xs text-[#B42318]">{errors.fieldName}</p>
              )}
            </div>

            {/* Field 2: Cascading Address Dropdowns (Province -> District -> Subdistrict) */}
            <div className="pt-2 border-t border-[#E3E6E4]">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={16} className="text-[#2D7048]" />
                <label className="text-sm font-medium text-[#1A1F1C]">
                  ที่ตั้งแปลงเพาะปลูก <span className="text-[#B42318]">*</span>
                </label>
              </div>
              <p className="text-xs text-[#5A635D] mb-3">
                เลือกจังหวัด อำเภอ และตำบลที่ตั้งของแปลงนาข้าว
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Province Dropdown */}
                <div>
                  <label className="block text-xs text-[#5A635D] mb-1">
                    จังหวัด <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
                  >
                    <option value="">— เลือกจังหวัด —</option>
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.province}</p>
                  )}
                </div>

                {/* District Dropdown */}
                <div>
                  <label className="block text-xs text-[#5A635D] mb-1">
                    อำเภอ / เขต <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    value={form.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!form.province || isSubmitting}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2] disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!form.province ? '— กรุณาเลือกจังหวัดก่อน —' : '— เลือกอำเภอ/เขต —'}
                    </option>
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.district}</p>
                  )}
                </div>

                {/* Subdistrict Dropdown */}
                <div>
                  <label className="block text-xs text-[#5A635D] mb-1">
                    ตำบล / แขวง <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    value={form.subdistrict}
                    onChange={(e) => handleSubdistrictChange(e.target.value)}
                    disabled={!form.district || isSubmitting}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2] disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!form.district ? '— กรุณาเลือกอำเภอก่อน —' : '— เลือกตำบล/แขวง —'}
                    </option>
                    {subdistricts.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  {errors.subdistrict && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.subdistrict}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Field 3: Cultivated Area (Raw 3 Units: Rai, Ngan, SqWah) */}
            <div className="pt-2 border-t border-[#E3E6E4]">
              <label className="block text-sm font-medium text-[#1A1F1C] mb-1">
                ขนาดพื้นที่เพาะปลูก (ไร่ - งาน - ตารางวา) <span className="text-[#B42318]">*</span>
              </label>
              <p className="text-xs text-[#5A635D] mb-3">
                ระบุหน่วย ไร่, งาน หรือ ตารางวา เป็นจำนวนเต็มแยกกัน
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#5A635D] mb-1">
                    ไร่
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={areaText.areaRai}
                    onChange={(e) => handleAreaChange('areaRai', e.target.value)}
                    placeholder="0"
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                  />
                  {errors.areaRai && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.areaRai}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-[#5A635D] mb-1">
                    งาน
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    min={0}
                    max={3}
                    step={1}
                    value={areaText.areaNgan}
                    onChange={(e) => handleAreaChange('areaNgan', e.target.value)}
                    placeholder="0"
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                  />
                  {errors.areaNgan && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.areaNgan}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-[#5A635D] mb-1">
                    ตารางวา
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    min={0}
                    max={99}
                    step={1}
                    value={areaText.areaSqWah}
                    onChange={(e) => handleAreaChange('areaSqWah', e.target.value)}
                    placeholder="0"
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                  />
                  {errors.areaSqWah && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.areaSqWah}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Field 4: Planting Date */}
            <div className="pt-2 border-t border-[#E3E6E4]">
              <label className="block text-sm font-medium text-[#1A1F1C] mb-1.5">
                วันที่เริ่มปลูกข้าว <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.plantingDate}
                  onChange={(e) => handleFieldChange('plantingDate', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] scheme-light"
                />
                <Calendar
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29D]"
                />
              </div>
              {errors.plantingDate && (
                <p className="mt-1 text-xs text-[#B42318]">{errors.plantingDate}</p>
              )}
            </div>

            {/* Success Feedback Banner */}
            {successMessage && (
              <div className="p-4 rounded-md bg-[#E8F5EC] border border-[#B7DFC6] text-xs text-[#1E7B45] space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={18} className="shrink-0 text-[#2D7048]" />
                  <span>{successMessage}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#B7DFC6]/60">
                  <Link
                    href="/member/dashboard"
                    className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white font-medium text-xs transition-colors"
                  >
                    กลับสู่หน้าแดชบอร์ด
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-md bg-white hover:bg-[#F1F3F2] border border-[#B7DFC6] text-[#1E7B45] font-medium text-xs transition-colors cursor-pointer"
                  >
                    เพิ่มแปลงนาอื่นต่อ
                  </button>
                </div>
              </div>
            )}

            {/* Error Feedback Banner */}
            {apiError && (
              <div className="p-4 rounded-md bg-[#FDECEA] border border-[#F4B9B3] flex items-center justify-between gap-3 text-[#B42318] text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{apiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="text-xs text-[#B42318] hover:underline cursor-pointer shrink-0"
                >
                  ปิด
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#E3E6E4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/member/dashboard')}
                disabled={isSubmitting}
                className="h-10 px-4 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium rounded-md transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกแปลงนา</span>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}