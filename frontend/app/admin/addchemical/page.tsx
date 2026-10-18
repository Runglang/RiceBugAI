'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import ImageUpload from '@/app/components/shared/ImageUpload';
import { Save, Loader2, AlertCircle, CheckCircle2, X, ChevronLeft } from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const CHEMICALS_API_URL = `${API_ORIGIN}/api/v1/chemicals`;
const INSECTS_API_URL = `${API_ORIGIN}/api/v1/insects`;

interface InsectOption {
  insectID: string;
  insectName: string;
}

interface ChemicalDTO {
  chemicalID?: string;
  chemicalName: string;
  activeIngredient: string;
  property: string;
  usageMethod: string;
  dosageRate: number;
  dosageUnit: string;
  toxicityLevel: string;
  chemicalImg?: string | null;
  description: string;
  warning: string;
  targetInsects: Pick<InsectOption, 'insectID'>[];
}

interface FormState {
  chemicalName: string;
  activeIngredient: string;
  property: string;
  usageMethod: string;
  dosageRate: string;
  dosageUnit: string;
  toxicityLevel: string;
  description: string;
  warning: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';
interface Status {
  state: SubmitState;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
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

// ---------- Validation ตาม SRS ----------
const CHEMICAL_NAME_MAX = 50;
const ACTIVE_INGREDIENT_MAX = 50;
const PROPERTY_MAX = 1000;
const MAX_CHEMICAL_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ตัวเลขล้วน จำนวนเต็มหรือทศนิยม (ไม่มีเครื่องหมาย) ไม่ใช้ parseFloat ตรวจ เพื่อกัน "12abc"
const NUMERIC_ONLY_REGEX = /^(\d+(\.\d+)?|\.\d+)$/;

function validateChemicalForm(
  form: FormState,
  targetInsectCount: number,
  imageFile: File | null
): string[] {
  const errors: string[] = [];

  // รูปภาพบรรจุภัณฑ์สารเคมี
  if (!imageFile) {
    errors.push('รูปภาพบรรจุภัณฑ์: กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป');
  } else if (imageFile.size > MAX_CHEMICAL_IMAGE_SIZE_BYTES) {
    errors.push('รูปภาพบรรจุภัณฑ์: ขนาดไฟล์ต้องไม่เกิน 10 MB');
  }

  // ชื่อสารเคมี
  const name = form.chemicalName.trim();
  if (!name) {
    errors.push('ชื่อสารเคมี: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  } else if (name.length > CHEMICAL_NAME_MAX) {
    errors.push(`ชื่อสารเคมี: ต้องมีความยาวไม่เกิน ${CHEMICAL_NAME_MAX} ตัวอักษร`);
  }

  // สารสำคัญ
  const ingredient = form.activeIngredient.trim();
  if (!ingredient) {
    errors.push('สารสำคัญ: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  } else if (ingredient.length > ACTIVE_INGREDIENT_MAX) {
    errors.push(`สารสำคัญ: ต้องมีความยาวไม่เกิน ${ACTIVE_INGREDIENT_MAX} ตัวอักษร`);
  }

  // อัตราการใช้งาน (ตรวจจากข้อความดิบ ไม่ trim)
  const dosage = form.dosageRate;
  if (dosage === '') {
    errors.push('อัตราปริมาณการใช้: กรุณากรอกข้อมูล');
  } else if (/\s/.test(dosage)) {
    errors.push('อัตราปริมาณการใช้: ห้ามมีช่องว่าง');
  } else if (!NUMERIC_ONLY_REGEX.test(dosage)) {
    errors.push('อัตราปริมาณการใช้: ต้องเป็นตัวเลขเท่านั้น (จำนวนเต็มหรือทศนิยม)');
  } else if (!(Number(dosage) > 0)) {
    errors.push('อัตราปริมาณการใช้: ต้องมีค่ามากกว่า 0');
  }

  // สรรพคุณ
  const property = form.property.trim();
  if (!property) {
    errors.push('คุณสมบัติและกลไกการออกฤทธิ์: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  } else if (property.length > PROPERTY_MAX) {
    errors.push(`คุณสมบัติและกลไกการออกฤทธิ์: ต้องมีความยาวไม่เกิน ${PROPERTY_MAX} ตัวอักษร`);
  }

  // คำอธิบายการใช้งาน
  if (!form.description.trim()) {
    errors.push('คำแนะนำสำหรับการใช้งานและอัตราผสม: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  }

  // คำเตือนในการใช้งาน
  if (!form.warning.trim()) {
    errors.push('คำเตือนและข้อควรระวังความปลอดภัย: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  }

  // ----- เงื่อนไขเดิมที่คงไว้ -----
  if (!form.toxicityLevel) errors.push('ระดับความเป็นพิษ: กรุณาเลือกระดับ');
  if (!form.usageMethod) errors.push('วิธีการใช้งาน: กรุณาเลือกวิธีการใช้งาน');
  if (!form.dosageUnit) errors.push('หน่วยของอัตราปริมาณการใช้: กรุณาเลือกหน่วย');
  if (targetInsectCount === 0) errors.push('แมลงศัตรูพืชเป้าหมาย: กรุณาเลือกอย่างน้อย 1 ชนิด');

  return errors;
}

export default function AddChemicalPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormState>(initialFormState);

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

  useEffect(() => {
    const controller = new AbortController();

    async function loadInsects() {
      try {
        const res = await fetch(INSECTS_API_URL, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error(`โหลดรายชื่อแมลงไม่สำเร็จ (HTTP ${res.status})`);
        const data: InsectOption[] = await res.json();
        if (!controller.signal.aborted) setAllInsects(Array.isArray(data) ? data : []);
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

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileRemove = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleReset = () => {
    setFormData(initialFormState);
    setTargetInsects([]);
    handleFileRemove();
    setStatus({ state: 'idle', message: '' });
  };

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
    targetInsects: targetInsects.map((i) => ({ insectID: i.insectID })),
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.state === 'loading') return;

    const validationErrors = validateChemicalForm(formData, targetInsects.length, imageFile);
    if (validationErrors.length > 0) {
      setStatus({
        state: 'error',
        message: `กรุณาแก้ไขข้อมูลต่อไปนี้: ${validationErrors.join(' / ')}`,
      });
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

      // Clear the form fields and image preview immediately because chemical record has been created in DB.
      // This prevents the user from accidentally pressing submit to create a duplicate record.
      setFormData(initialFormState);
      setTargetInsects([]);
      handleFileRemove();

      // Case 1: User selected an image, but saved?.chemicalID is missing
      if (imageFile && !saved?.chemicalID) {
        setStatus({
          state: 'error',
          message: 'บันทึกข้อมูลสารเคมีลงฐานข้อมูลแล้ว แต่ไม่สามารถอัปโหลดรูปภาพได้เนื่องจากไม่ได้รับรหัสสารเคมีจากเซิร์ฟเวอร์ กรุณาตรวจสอบที่หน้ารายการสารเคมี',
          actionUrl: '/admin/listadminchemicals',
          actionLabel: 'ไปที่หน้ารายการสารเคมี',
        });
        return;
      }

      // Case 2: User selected an image, and saved?.chemicalID exists
      if (imageFile && saved?.chemicalID) {
        let imageWarning = '';
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        try {
          const imgRes = await fetch(`${CHEMICALS_API_URL}/${saved.chemicalID}/image`, {
            method: 'POST',
            body: imgForm,
          });
          if (!imgRes.ok) {
            const imgErrText = await imgRes.text().catch(() => '');
            imageWarning = imgErrText || `HTTP ${imgRes.status}`;
          }
        } catch {
          imageWarning = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
        }

        if (imageWarning) {
          setStatus({
            state: 'error',
            message: `บันทึกข้อมูลสารเคมีลงฐานข้อมูลแล้ว แต่รูปภาพอัปโหลดไม่สำเร็จ (${imageWarning}) กรุณาไปจัดการรูปภาพที่หน้าแก้ไขข้อมูลสารเคมี`,
            actionUrl: `/admin/editchemical?chemicalId=${saved.chemicalID}`,
            actionLabel: 'ไปที่หน้าแก้ไขข้อมูลสารเคมี',
          });
          return;
        }
      }

      // Case 3: Image upload succeeded, or no image selected
      setStatus({
        state: 'success',
        message: 'บันทึกข้อมูลสารเคมีลงฐานข้อมูลสำเร็จ',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || insectsLoading;

  return (
    <div className="space-y-6 font-sans">

      {/* Back Link & Page Header */}
      <div>
        <Link
          href="/admin/listadminchemicals"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A635D] hover:text-[#111813] transition-colors mb-3"
        >
          <ChevronLeft size={14} />
          <span>กลับไปหน้ารายการสารเคมี</span>
        </Link>
        <div className="pb-6 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            เพิ่มสารเคมีใหม่
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            ลงทะเบียนข้อมูลสารเคมีป้องกันกำจัดแมลง สารออกฤทธิ์ อัตราการใช้ และคำแนะนำความปลอดภัย
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Left Column: Image Upload */}
        <div className="md:col-span-5 bg-white border border-[#E3E6E4] rounded-lg p-6 space-y-4">
          <ImageUpload
            label="ภาพบรรจุภัณฑ์สารเคมี"
            description="อัปโหลดภาพฉลากหรือบรรจุภัณฑ์ที่มีความชัดเจน"
            mode="single"
            selectedFile={imageFile}
            previewUrl={imagePreview}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            maxSizeBytes={10 * 1024 * 1024}
            helperText="PNG, JPG, WEBP (สูงสุด 10MB)"
          />
        </div>

        {/* Right Column: Chemical Form */}
        <div className="md:col-span-7 bg-white border border-[#E3E6E4] rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight text-[#1A1F1C]">
              ข้อมูลทะเบียนสารเคมีเกษตร
            </h2>
            <p className="text-xs text-[#5A635D] mt-1">
              กรอกข้อมูลสูตร สารออกฤทธิ์ และอัตราการใช้ตามคำแนะนำ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Chemical Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ชื่อสารเคมี <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.chemicalName}
                onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                placeholder="เช่น อิมิดาโคลพริด (Imidacloprid 20% SL)"
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Active Ingredient */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ส่วนประกอบสำคัญ (Active Ingredient) <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.activeIngredient}
                onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
                placeholder="เช่น Imidacloprid"
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs italic text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Toxicity Level & Usage Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                  ระดับความเป็นพิษ <span className="text-[#B42318]">*</span>
                </label>
                <select
                  value={formData.toxicityLevel}
                  onChange={(e) => setFormData({ ...formData, toxicityLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
                >
                  <option value="">เลือกระดับ...</option>
                  <option value="low">ระดับต่ำ (ปลอดภัย)</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="high">ระดับสูง (อันตราย)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                  วิธีการใช้งาน <span className="text-[#B42318]">*</span>
                </label>
                <select
                  value={formData.usageMethod}
                  onChange={(e) => setFormData({ ...formData, usageMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
                >
                  <option value="">เลือกวิธีการใช้งาน...</option>
                  <option value="foliar_spray">พ่นทางใบ</option>
                  <option value="broadcast">หว่าน/โรยเม็ด</option>
                </select>
              </div>
            </div>

            {/* Dosage & Unit */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                อัตราปริมาณการใช้ <span className="text-[#B42318]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.dosageRate}
                  onChange={(e) => setFormData({ ...formData, dosageRate: e.target.value })}
                  placeholder="เช่น 20"
                  className="flex-1 px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs font-semibold text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                />
                <select
                  value={formData.dosageUnit}
                  onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}
                  className="w-48 px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
                >
                  <option value="">เลือกหน่วย...</option>
                  <option value="ml/rai">มิลลิลิตร/ไร่</option>
                  <option value="L/rai">ลิตร/ไร่</option>
                  <option value="g/rai">กรัม/ไร่</option>
                  <option value="kg/rai">กิโลกรัม/ไร่</option>
                  <option value="ml/20L">มิลลิลิตร/น้ำ 20 ลิตร</option>
                  <option value="g/20L">กรัม/น้ำ 20 ลิตร</option>
                </select>
              </div>
            </div>

            {/* Properties */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                คุณสมบัติและกลไกการออกฤทธิ์ <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.property}
                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                placeholder="เช่น ดูดซึมผ่านทางใบและราก ยับยั้งระบบประสาทของแมลง"
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Target Pests */}
            <div ref={wrapperRef} className="pt-3 border-t border-[#E3E6E4]">
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                แมลงศัตรูพืชเป้าหมาย <span className="text-[#B42318]">*</span>
              </label>

              {insectsError && (
                <p className="text-xs text-[#B42318] mb-1">{insectsError}</p>
              )}

              <div className="relative">
                <div className="w-full p-2 bg-white border border-[#CDD2CF] rounded-md flex flex-wrap gap-1.5 focus-within:border-[#2D7048] focus-within:ring-2 focus-within:ring-[#B9DBC6] min-h-[42px] items-center">
                  {targetInsects.map((insect) => (
                    <span
                      key={insect.insectID}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F0F7F2] text-[#2D7048] border border-[#B9DBC6] rounded-sm text-xs font-medium"
                    >
                      {insect.insectName}
                      <button
                        type="button"
                        onClick={() => removeInsect(insect.insectID)}
                        className="hover:text-[#B42318] transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={pestInput}
                    onChange={handlePestInputChange}
                    onFocus={() => pestInput.trim().length > 0 && setIsDropdownOpen(true)}
                    disabled={insectsLoading}
                    placeholder={insectsLoading ? 'กำลังโหลดรายชื่อแมลง...' : 'พิมพ์ชื่อแมลงเพื่อค้นหา...'}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-xs text-[#1A1F1C] placeholder-[#9AA29D] disabled:cursor-not-allowed"
                  />
                </div>

                {isDropdownOpen && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-[#E3E6E4] rounded-md shadow-lg max-h-52 overflow-y-auto">
                    {suggestions.map((insect) => (
                      <li
                        key={insect.insectID}
                        onClick={() => handleSelectInsect(insect)}
                        className="px-3.5 py-2 hover:bg-[#F7F8F7] cursor-pointer border-b border-[#E3E6E4] last:border-0 text-xs font-medium text-[#1A1F1C]"
                      >
                        {insect.insectName}
                      </li>
                    ))}
                  </ul>
                )}

                {isDropdownOpen && suggestions.length === 0 && pestInput.trim().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E3E6E4] rounded-md shadow-lg px-3.5 py-2 text-xs text-[#5A635D] text-center font-medium">
                    ไม่พบรายชื่อแมลงที่ค้นหา
                  </div>
                )}
              </div>
            </div>

            {/* Description / Instructions */}
            <div className="pt-3 border-t border-[#E3E6E4]">
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                คำแนะนำสำหรับการใช้งานและอัตราผสม <span className="text-[#B42318]">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ระบุวิธีการผสม คำแนะนำการฉีดพ่น ช่วงเวลาที่เหมาะสม..."
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] resize-none"
              />
            </div>

            {/* Warning */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                คำเตือนและข้อควรระวังความปลอดภัย <span className="text-[#B42318]">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.warning}
                onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                placeholder="ระบุข้อควรระวัง อุปกรณ์ป้องกันส่วนบุคคล ระยะเว้นการเก็บเกี่ยว (PHI)..."
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] resize-none"
              />
            </div>

            {/* Status Feedback */}
            {status.state === 'success' && (
              <div className="flex items-center gap-2 text-xs font-medium text-[#1E7B45] bg-[#E8F5EC] border border-[#B7DFC6] rounded-md p-3">
                <CheckCircle2 size={16} className="shrink-0 text-[#1E7B45]" />
                <span>{status.message}</span>
              </div>
            )}
            {status.state === 'error' && (
              <div className="flex flex-col gap-2.5 text-xs font-medium text-[#B42318] bg-[#FDECEA] border border-[#F4B9B3] rounded-md p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-[#B42318]" />
                  <span>{status.message}</span>
                </div>
                {status.actionUrl && (
                  <div className="pt-2 border-t border-[#F4B9B3]/60 flex items-center gap-2">
                    <Link
                      href={status.actionUrl}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-[#B42318] hover:bg-[#911D13] text-white font-medium text-xs transition-colors"
                    >
                      {status.actionLabel || 'ไปที่หน้ารายการ'}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3E6E4]">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-medium text-[#1A1F1C] bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] rounded-md transition-colors cursor-pointer"
              >
                ล้างฟอร์ม
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-9 px-4 text-xs font-medium text-white bg-[#2D7048] hover:bg-[#25593A] rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสารเคมี'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}