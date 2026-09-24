'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const CHEMICALS_API_URL = `${API_ORIGIN}/api/v1/chemicals`;
const INSECTS_API_URL = `${API_ORIGIN}/api/v1/insects`;

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
  toxicityLevel: string; // 'ต่ำ' | 'กลาง' | 'สูง'
  chemicalImg?: string | null;
  description: string;
  warning: string;
  targetInsects: InsectOption[];
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

type PageState = 'loading' | 'ready' | 'notFound' | 'loadError';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';
interface Status {
  state: SubmitState;
  message: string;
}

const emptyFormState: FormState = {
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

function EditChemicalForm() {
  const searchParams = useSearchParams();
  const chemicalId = searchParams.get('chemicalId') ?? undefined;
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');

  const [formData, setFormData] = useState<FormState>(emptyFormState);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // แมลงเป้าหมาย: รายชื่อทั้งหมดสำหรับค้นหา + ที่เลือกไว้แล้ว
  const [allInsects, setAllInsects] = useState<InsectOption[]>([]);
  const [insectsLoading, setInsectsLoading] = useState(true);
  const [insectsError, setInsectsError] = useState<string | null>(null);
  const [targetInsects, setTargetInsects] = useState<InsectOption[]>([]);
  const [pestInput, setPestInput] = useState('');
  const [suggestions, setSuggestions] = useState<InsectOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

  // โหลดรายชื่อแมลงทั้งหมดสำหรับ autocomplete
  useEffect(() => {
    const controller = new AbortController();

    async function fetchInsects() {
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

    fetchInsects();

    return () => {
      controller.abort();
    };
  }, []);

  // โหลดข้อมูลสารเคมีเดิมมา prefill
  useEffect(() => {
    if (!chemicalId) return;

    const controller = new AbortController();

    async function loadChemical() {
      try {
        const res = await fetch(`${CHEMICALS_API_URL}/${chemicalId}`, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setPageState('notFound');
          return;
        }
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);

        const data: ChemicalDTO = await res.json();
        if (controller.signal.aborted) return;

        setFormData({
          chemicalName: data.chemicalName,
          activeIngredient: data.activeIngredient,
          property: data.property,
          usageMethod: data.usageMethod,
          dosageRate: String(data.dosageRate ?? ''),
          dosageUnit: data.dosageUnit,
          toxicityLevel: data.toxicityLevel,
          description: data.description,
          warning: data.warning,
        });
        setTargetInsects(data.targetInsects ?? []);
        setExistingImageUrl(data.chemicalImg ?? null);
        setPageState('ready');
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadErrorMsg(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
          setPageState('loadError');
        }
      }
    }

    loadChemical();

    return () => {
      controller.abort();
    };
  }, [chemicalId]);

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
    setImageRemoved(false);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // หมายเหตุ: backend ยังไม่มี endpoint สำหรับ "ลบรูปภาพ" โดยเฉพาะ ปุ่มนี้แค่เคลียร์ preview ในจอ
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
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
    // ตอน edit backend รับแค่ insectID ต่อ object พอ
    targetInsects: targetInsects.map((i) => ({ insectID: i.insectID, insectName: '' })),
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chemicalId) return;

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
      setStatus({ state: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง' });
      return;
    }

    setStatus({ state: 'loading', message: '' });

    try {
      const res = await fetch(`${CHEMICALS_API_URL}/${chemicalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `อัปเดตไม่สำเร็จ (HTTP ${res.status})`);
      }

      let imageWarning = '';
      if (imageFile) {
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        try {
          const imgRes = await fetch(`${CHEMICALS_API_URL}/${chemicalId}/image`, {
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
        message: 'อัปเดตข้อมูลสารเคมีสำเร็จ' + imageWarning,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || insectsLoading;
  const displayImageUrl = imagePreview ?? (imageRemoved ? null : existingImageUrl);

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        กำลังโหลดข้อมูลสารเคมี...
      </div>
    );
  }

  if (pageState === 'notFound') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-gray-600">ไม่พบข้อมูลสารเคมีนี้ อาจถูกลบไปแล้ว</p>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          กลับไปหน้ารายการ
        </button>
      </div>
    );
  }

  if (pageState === 'loadError') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{loadErrorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-4 sm:p-8 md:p-12 font-sans text-gray-900 flex justify-center">
      <div className="max-w-5xl w-full">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5 tracking-tight">แก้ไขสารเคมีกำจัดแมลง</h1>
          <p className="text-sm text-gray-500">
            ปรับปรุงข้อมูลจำเพาะและคำแนะนำการใช้งานสำหรับ {formData.chemicalName || 'สารเคมีนี้'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">

              {/* Top Section: Image & Form Grid */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">

                {/* Left Column: Image Upload */}
                <div className="w-full md:w-1/3 shrink-0">
                  <label className="block text-sm font-bold text-gray-700 mb-2">รูปภาพสินค้า</label>
                  <div className="border border-dashed border-gray-300 bg-gray-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden relative border border-gray-200">
                      {displayImageUrl ? (
                        <Image
                          src={displayImageUrl}
                          alt={formData.chemicalName || 'รูปสารเคมี'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm mb-2 cursor-pointer">
                      <Camera className="w-4 h-4" />
                      อัปเดตรูปภาพ
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {displayImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                      >
                        ลบรูปภาพ
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                  </div>
                </div>

                {/* Right Column: Key Details */}
                <div className="w-full md:w-2/3 flex flex-col gap-5">

                  {/* Chemical Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">ชื่อสารเคมี</label>
                    <input
                      type="text"
                      value={formData.chemicalName}
                      onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow"
                    />
                  </div>

                  {/* 2-Col Grid for smaller inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">ส่วนประกอบสำคัญ</label>
                      <input
                        type="text"
                        value={formData.activeIngredient}
                        onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">ระดับความเป็นพิษ</label>
                      <div className="relative">
                        <select
                          value={formData.toxicityLevel}
                          onChange={(e) => setFormData({ ...formData, toxicityLevel: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 appearance-none bg-white transition-shadow"
                        >
                          <option value="" disabled>เลือกระดับ...</option>
                          <option value="low">ต่ำ</option>
                          <option value="medium">กลาง</option>
                          <option value="high">สูง</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">วิธีการใช้งาน</label>
                      <div className="relative">
                        <select
                          value={formData.usageMethod}
                          onChange={(e) => setFormData({ ...formData, usageMethod: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 appearance-none bg-white transition-shadow"
                        >
                          <option value="" disabled>เลือกวิธีการใช้งาน...</option>
                          <option value="foliar_spray">พ่นทางใบ</option>
                          <option value="broadcast">หว่าน/โรยเม็ด</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">อัตราปริมาณ</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.dosageRate}
                          onChange={(e) => setFormData({ ...formData, dosageRate: e.target.value })}
                          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow"
                        />
                        <select
                          value={formData.dosageUnit}
                          onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}
                          className="w-32 shrink-0 px-2 py-2.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 appearance-none bg-white transition-shadow"
                        >
                          <option value="" disabled>หน่วย...</option>
                          <option value="ml/rai">มล./ไร่</option>
                          <option value="L/rai">ล./ไร่</option>
                          <option value="g/rai">ก./ไร่</option>
                          <option value="kg/rai">กก./ไร่</option>
                          <option value="ml/20L">มล./น้ำ20ล.</option>
                          <option value="g/20L">ก./น้ำ20ล.</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Section: Full Width Details */}
              <div className="space-y-6">

                {/* Properties */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">สรรพคุณ</label>
                  <input
                    type="text"
                    value={formData.property}
                    onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow"
                  />
                </div>

                {/* Target Pests (real autocomplete) */}
                <div ref={wrapperRef}>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">แมลงเป้าหมาย</label>

                  {insectsError && <p className="text-xs text-red-500 mb-1.5">{insectsError}</p>}

                  <div className="relative">
                    <div className="w-full p-2 border border-gray-200 rounded-lg flex flex-wrap gap-2 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-shadow min-h-[46px] items-center bg-white">
                      {targetInsects.map((insect) => (
                        <span
                          key={insect.insectID}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#dcfce7] text-[#166534] text-xs font-semibold rounded border border-[#bbf7d0]"
                        >
                          {insect.insectName}
                          <button
                            type="button"
                            onClick={() => removeInsect(insect.insectID)}
                            className="hover:bg-green-300 rounded p-0.5 transition-colors"
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
                        placeholder={insectsLoading ? 'กำลังโหลดรายชื่อแมลง...' : 'เพิ่มแมลง...'}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 px-1 disabled:cursor-not-allowed"
                      />
                    </div>

                    {isDropdownOpen && suggestions.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
                        {suggestions.map((insect) => (
                          <li
                            key={insect.insectID}
                            onClick={() => handleSelectInsect(insect)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors text-sm font-semibold text-gray-900"
                          >
                            {insect.insectName}
                          </li>
                        ))}
                      </ul>
                    )}

                    {isDropdownOpen && suggestions.length === 0 && pestInput.trim().length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500 text-center">
                        ไม่พบรายชื่อแมลงที่คุณค้นหา
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">คำแนะนำสำหรับการใช้งาน</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none transition-shadow"
                  />
                </div>

                {/* Warnings */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">คำเตือน</label>
                  <textarea
                    rows={4}
                    value={formData.warning}
                    onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none transition-shadow"
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

              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-[#F3F5F1] border-t border-gray-100 p-4 px-6 flex flex-col sm:flex-row justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/listadminchemicals')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-900 bg-[#cbd5e1] hover:bg-[#94a3b8] border border-transparent rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'กำลังบันทึก...' : 'อัปเดตสารเคมี'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditChemicalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลด...
        </div>
      }
    >
      <EditChemicalForm />
    </Suspense>
  );
}