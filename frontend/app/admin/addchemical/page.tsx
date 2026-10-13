'use client';

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import ImageUpload from '@/app/components/shared/ImageUpload';
import { Save, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

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
        message: 'บันทึกข้อมูลสารเคมีลงฐานข้อมูลสำเร็จ' + imageWarning,
      });

      if (!imageWarning) {
        handleReset();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || insectsLoading;

  return (
    <div className="space-y-6 font-sans">

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
            <h1 className="text-lg font-bold tracking-tight text-[#1A1F1C]">
              ข้อมูลทะเบียนสารเคมีเกษตร
            </h1>
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
                  type="number"
                  step="0.01"
                  min="0"
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
              <div className="flex items-center gap-2 text-xs font-medium text-[#B42318] bg-[#FDECEA] border border-[#F4B9B3] rounded-md p-3">
                <AlertCircle size={16} className="shrink-0 text-[#B42318]" />
                <span>{status.message}</span>
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
