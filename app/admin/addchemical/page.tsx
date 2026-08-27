'use client';

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const CHEMICALS_API_URL = `${API_ORIGIN}/api/v1/chemicals`;
const INSECTS_API_URL = `${API_ORIGIN}/api/v1/insects`;

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.InsectDTO (เอาแค่ field ที่ใช้ในหน้านี้)
interface InsectOption {
  insectID: string;
  insectName: string;
}

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.ChemicalDTO
interface ChemicalDTO {
  chemicalID?: string;
  chemicalName: string;
  activeIngredient: string;
  property: string;
  usageMethod: string;
  dosageRate: number;
  dosageUnit: string;
  toxicityLevel: string;
  chemicalImg?: string | null; // response = URL, request = ไม่ต้องส่ง (รูปแยกเป็น MultipartFile)
  description: string;
  warning: string;
  targetInsects: Pick<InsectOption, 'insectID'>[];
}

interface FormState {
  chemicalName: string;
  activeIngredient: string;
  property: string;
  usageMethod: string;
  dosageRate: string; // เก็บเป็น string ตอนกรอก แล้วค่อย parse เป็น number ตอน submit
  dosageUnit: string;
  toxicityLevel: string;
  description: string;
  warning: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';
interface Status {
  state: SubmitState;
  message: string;
}

const initialFormState: FormState = {
  chemicalName: '',
  activeIngredient: '',
  property: '',
  usageMethod: '',
  dosageRate: '',
  dosageUnit: '',
  toxicityLevel: '',
  description: '',
  warning: '',
};

export default function AddChemicalPage() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormState>(initialFormState);

  // รายชื่อแมลงทั้งหมดจาก backend สำหรับ autocomplete
  const [allInsects, setAllInsects] = useState<InsectOption[]>([]);
  const [insectsLoading, setInsectsLoading] = useState(true);
  const [insectsError, setInsectsError] = useState<string | null>(null);

  const [targetInsects, setTargetInsects] = useState<InsectOption[]>([]);
  const [pestInput, setPestInput] = useState('');
  const [suggestions, setSuggestions] = useState<InsectOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

  // โหลดรายชื่อแมลงทั้งหมดมาไว้ค้นหาแบบ autocomplete
  // setState ทุกตัวอยู่หลัง await → ไม่ synchronous → ไม่โดนเตือน
  useEffect(() => {
    const controller = new AbortController();

    async function loadInsects() {
      try {
        const res = await fetch(INSECTS_API_URL, { signal: controller.signal });

        if (controller.signal.aborted) return;

        if (!res.ok) throw new Error(`โหลดรายชื่อแมลงไม่สำเร็จ (HTTP ${res.status})`);
        const data: InsectOption[] = await res.json();

        if (!controller.signal.aborted) setAllInsects(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setInsectsError(err instanceof Error ? err.message : 'โหลดรายชื่อแมลงไม่สำเร็จ');
        }
      } finally {
        if (!controller.signal.aborted) setInsectsLoading(false);
      }
    }

    loadInsects();

    return () => {
      controller.abort();
    };
  }, []);

  // ปิด dropdown เมื่อคลิกนอกช่อง
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePestInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPestInput(value);

    if (value.trim().length > 0) {
      const filtered = allInsects.filter(
        (insect) =>
          insect.insectName.toLowerCase().includes(value.toLowerCase()) &&
          !targetInsects.some((selected) => selected.insectID === insect.insectID)
      );
      setSuggestions(filtered);
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectInsect = (insect: InsectOption) => {
    setTargetInsects([...targetInsects, insect]);
    setPestInput('');
    setIsDropdownOpen(false);
  };

  const removeInsect = (insectID: string) => {
    setTargetInsects(targetInsects.filter((i) => i.insectID !== insectID));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const buildPayload = (): Omit<ChemicalDTO, 'chemicalID' | 'chemicalImg'> => ({
    chemicalName: formData.chemicalName,
    activeIngredient: formData.activeIngredient,
    property: formData.property,
    usageMethod: formData.usageMethod,
    dosageRate: parseFloat(formData.dosageRate),
    dosageUnit: formData.dosageUnit,
    toxicityLevel: formData.toxicityLevel,
    description: formData.description,
    warning: formData.warning,
    // ตอน add/edit backend รับแค่ insectID ต่อ object พอ
    targetInsects: targetInsects.map((i) => ({ insectID: i.insectID })),
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const dosageNumber = parseFloat(formData.dosageRate);
    if (
      !formData.chemicalName ||
      !formData.activeIngredient ||
      !formData.toxicityLevel ||
      !formData.usageMethod ||
      !formData.property ||
      !formData.description ||
      !formData.warning ||
      formData.dosageRate === '' ||
      !formData.dosageUnit ||
      Number.isNaN(dosageNumber) ||
      targetInsects.length === 0
    ) {
      setStatus({ state: 'error', message: 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วนและถูกต้อง' });
      return;
    }

    setStatus({ state: 'loading', message: '' });

    try {
      const res = await fetch(CHEMICALS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
      }

      const saved: ChemicalDTO = await res.json();

      let imageWarning = '';
      if (imageFile && saved?.chemicalID) {
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        try {
          const imgRes = await fetch(`${CHEMICALS_API_URL}/${saved.chemicalID}/image`, {
            method: 'POST',
            body: imgForm,
          });
          if (!imgRes.ok) {
            const imgErrText = await imgRes.text().catch(() => '');
            imageWarning = ` (แต่รูปภาพอัปโหลดไม่สำเร็จ: ${imgErrText || `HTTP ${imgRes.status}`})`;
          }
        } catch {
          imageWarning = ' (แต่รูปภาพอัปโหลดไม่สำเร็จ: เชื่อมต่อเซิร์ฟเวอร์ไม่ได้)';
        }
      }

      setStatus({
        state: imageWarning ? 'error' : 'success',
        message: 'บันทึกข้อมูลสารเคมีสำเร็จ' + imageWarning,
      });

      if (!imageWarning) {
        setFormData(initialFormState);
        setTargetInsects([]);
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || insectsLoading;

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 flex items-center justify-center font-sans text-slate-700">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Column: Image Upload */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-fit">
          <div>
            <h2 className="text-base font-bold text-slate-800">ภาพสารเคมี</h2>
            <p className="text-xs text-slate-400 mt-1">
              โปรดอัปโหลดรูปภาพอ้างอิงที่มีความคมชัดและความละเอียดสูง
            </p>
          </div>

          <label className="mt-6 relative border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[320px] hover:border-emerald-300 transition-colors cursor-pointer group overflow-hidden">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="ตัวอย่างรูปสารเคมี"
                fill
                unoptimized
                className="object-contain rounded-lg p-2"
              />
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง
                </p>
                <p className="text-xs text-slate-400">
                  SVG, PNG, JPG or GIF (max. 800×400px)
                </p>
              </>
            )}
          </label>
        </div>

        {/* Right Column: Form Details */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800">รายละเอียดสารเคมี</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">ข้อมูลสารเคมีกำจัดศัตรูพืชขั้นพื้นฐาน</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Chemical Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อสารเคมี <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chemicalName}
                  onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                  placeholder="Imidacloprid 200SL"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Active Ingredient */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ส่วนประกอบสำคัญ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.activeIngredient}
                  onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
                  placeholder="Imidacloprid"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Toxicity Level */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ระดับความเป็นพิษ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.toxicityLevel}
                  onChange={(e) => setFormData({ ...formData, toxicityLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="">เลือกระดับ...</option>
                  <option value="low">ต่ำ</option>
                  <option value="medium">กลาง</option>
                  <option value="high">สูง</option>
                </select>
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  อัตราปริมาณยา <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dosageRate}
                    onChange={(e) => setFormData({ ...formData, dosageRate: e.target.value })}
                    placeholder="20"
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                  />
                  <select
                    value={formData.dosageUnit}
                    onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}
                    className="w-40 shrink-0 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="">หน่วย...</option>
                    <option value="ml/rai">มิลลิลิตร/ไร่</option>
                    <option value="L/rai">ลิตร/ไร่</option>
                    <option value="g/rai">กรัม/ไร่</option>
                    <option value="kg/rai">กิโลกรัม/ไร่</option>
                    <option value="ml/20L">มิลลิลิตร/น้ำ 20 ลิตร</option>
                    <option value="g/20L">กรัม/น้ำ 20 ลิตร</option>
                  </select>
                </div>
              </div>

              {/* Usage Method */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วิธีการใช้งาน <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.usageMethod}
                  onChange={(e) => setFormData({ ...formData, usageMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="">เลือกวิธีการใช้งาน...</option>
                  <option value="foliar_spray">พ่นทางใบ</option>
                  <option value="broadcast">หว่าน/โรยเม็ด</option>
                  <option value="seed_treatment">คลุกเมล็ด</option>
                  <option value="soil_drench">ราด/หยอดลงดิน</option>
                  <option value="water_mix">ใช้กับน้ำในนา</option>
                </select>
              </div>

              {/* Properties */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คุณสมบัติ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.property}
                  onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                  placeholder="Bayer CropScience"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Target Pests (autocomplete) */}
              <div ref={wrapperRef}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  แมลงเป้าหมาย <span className="text-red-500">*</span>
                </label>

                {insectsError && (
                  <p className="text-xs text-red-500 mb-1">{insectsError}</p>
                )}

                <div className="relative">
                  <div className="w-full p-2 border border-slate-200 rounded-lg flex flex-wrap gap-2 focus-within:border-slate-400 transition-colors min-h-[42px]">
                    {targetInsects.map((insect) => (
                      <span
                        key={insect.insectID}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#dcfce7] text-[#166534] text-xs font-semibold rounded-full"
                      >
                        {insect.insectName}
                        <button
                          type="button"
                          onClick={() => removeInsect(insect.insectID)}
                          className="hover:bg-green-300 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={pestInput}
                      onChange={handlePestInputChange}
                      onFocus={() => pestInput.trim().length > 0 && setIsDropdownOpen(true)}
                      disabled={insectsLoading}
                      placeholder={insectsLoading ? 'กำลังโหลดรายชื่อแมลง...' : 'พิมพ์เพื่อค้นหาศัตรูพืช...'}
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 disabled:cursor-not-allowed"
                    />
                  </div>

                  {isDropdownOpen && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
                      {suggestions.map((insect) => (
                        <li
                          key={insect.insectID}
                          onClick={() => handleSelectInsect(insect)}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors text-sm font-semibold text-slate-800"
                        >
                          {insect.insectName}
                        </li>
                      ))}
                    </ul>
                  )}

                  {isDropdownOpen && suggestions.length === 0 && pestInput.trim().length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-500 text-center">
                      ไม่พบรายชื่อแมลงที่คุณค้นหา
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">เลือกแมลงทุกชนิดที่สารเคมีนี้กำจัดได้</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คำแนะนำสำหรับการใช้งาน <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ระบุข้อควรระวังด้านความปลอดภัย วิธีการผสม และวิธีการใช้งานที่นี่..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              {/* Warning */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คำเตือน <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.warning}
                  onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                  placeholder="ระบุคำเตือนเกี่ยวกับการใช้สารเคมี..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              {/* Status message */}
              {status.state === 'success' && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}
              {status.state === 'error' && (
                <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2b3648] hover:bg-[#1e2736] rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกลงฐานข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}