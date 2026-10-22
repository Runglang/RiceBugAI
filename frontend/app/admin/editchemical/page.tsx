'use client';

import { useState, useEffect, ChangeEvent, FormEvent, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/app/components/shared/ImageUpload';
import { X, Loader2, AlertCircle, CheckCircle2, Save, ChevronLeft } from 'lucide-react';

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

// ---------- Validation ตาม Requirement ----------
const CHEMICAL_NAME_MAX = 100;
const ACTIVE_INGREDIENT_MAX = 100;
const PROPERTY_MAX = 1000;
const MAX_CHEMICAL_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// เลขจำนวนเต็มหรือทศนิยม เช่น 20, 0.5, 20.25, .5 (ไม่ใช้ parseFloat ตรวจ เพื่อกัน "12abc")
const NUMERIC_ONLY_REGEX = /^(\d+(\.\d+)?|\.\d+)$/;

function validateChemicalForm(
  form: FormState,
  targetInsectCount: number,
  hasImage: boolean,
  imageFile: File | null
): string[] {
  const errors: string[] = [];

  // รูปภาพบรรจุภัณฑ์สารเคมี (ต้องเหลือรูปอย่างน้อย 1 รูป โดยนับรูปเดิมที่ยังอยู่รวมกับรูปใหม่)
  if (!hasImage) {
    errors.push('รูปภาพบรรจุภัณฑ์: ต้องมีรูปภาพอย่างน้อย 1 รูป (สามารถใช้รูปเดิมหรืออัปโหลดรูปใหม่)');
  } else if (imageFile && imageFile.size > MAX_CHEMICAL_IMAGE_SIZE_BYTES) {
    errors.push('รูปภาพบรรจุภัณฑ์: ขนาดไฟล์ใหม่ต้องไม่เกิน 10 MB');
  }

  // ชื่อสารเคมี
  const name = form.chemicalName.trim();
  if (!name) {
    errors.push('ชื่อสารเคมี: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  } else if (name.length > CHEMICAL_NAME_MAX) {
    errors.push(`ชื่อสารเคมี: ต้องมีความยาวไม่เกิน ${CHEMICAL_NAME_MAX} ตัวอักษร`);
  }

  // ส่วนประกอบสำคัญ
  const ingredient = form.activeIngredient.trim();
  if (!ingredient) {
    errors.push('ส่วนประกอบสำคัญ: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  } else if (ingredient.length > ACTIVE_INGREDIENT_MAX) {
    errors.push(`ส่วนประกอบสำคัญ: ต้องมีความยาวไม่เกิน ${ACTIVE_INGREDIENT_MAX} ตัวอักษร`);
  }

  // อัตราปริมาณการใช้ (ตรวจจากข้อความดิบ ไม่ trim)
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

  // คุณสมบัติและกลไกการออกฤทธิ์
  const property = form.property.trim();
  if (!property) {
    errors.push('คุณสมบัติและกลไกการออกฤทธิ์: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  } else if (property.length > PROPERTY_MAX) {
    errors.push(`คุณสมบัติและกลไกการออกฤทธิ์: ต้องมีความยาวไม่เกิน ${PROPERTY_MAX} ตัวอักษร`);
  }

  // คำแนะนำสำหรับการใช้งาน
  if (!form.description.trim()) {
    errors.push('คำแนะนำสำหรับการใช้งานและอัตราผสม: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  }

  // คำเตือน
  if (!form.warning.trim()) {
    errors.push('คำเตือนและข้อควรระวังความปลอดภัย: กรุณากรอกข้อมูล (ห้ามเว้นว่างหรือมีเพียงช่องว่าง)');
  }

  // ----- เงื่อนไขเดิมที่คงไว้ -----
  if (!form.toxicityLevel) errors.push('ระดับความเป็นพิษ: กรุณาเลือกระดับ');
  if (!form.usageMethod) errors.push('วิธีการใช้งาน: กรุณาเลือกวิธีการใช้งาน');
  if (!form.dosageUnit) errors.push('หน่วยของอัตราปริมาณการใช้: กรุณาเลือกหน่วย');
  if (targetInsectCount === 0) errors.push('แมลงเป้าหมาย: กรุณาเลือกอย่างน้อย 1 ชนิด');

  return errors;
}

function EditChemicalForm() {
  const searchParams = useSearchParams();
  const chemicalId = searchParams.get('chemicalId') || searchParams.get('id') || undefined;
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');

  const [formData, setFormData] = useState<FormState>(emptyFormState);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [allInsects, setAllInsects] = useState<InsectOption[]>([]);
  const [insectsLoading, setInsectsLoading] = useState(true);
  const [insectsError, setInsectsError] = useState<string | null>(null);
  const [targetInsects, setTargetInsects] = useState<InsectOption[]>([]);
  const [pestInput, setPestInput] = useState('');
  const [suggestions, setSuggestions] = useState<InsectOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchInsects() {
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

    fetchInsects();

    return () => {
      controller.abort();
    };
  }, []);

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
          chemicalName: data.chemicalName || '',
          activeIngredient: data.activeIngredient || '',
          property: data.property || '',
          usageMethod: data.usageMethod || '',
          dosageRate: String(data.dosageRate ?? ''),
          dosageUnit: data.dosageUnit || '',
          toxicityLevel: data.toxicityLevel || '',
          description: data.description || '',
          warning: data.warning || '',
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
    setImageRemoved(false);
  };

  const handleFileRemove = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageRemoved(true);
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
    targetInsects: targetInsects.map((i) => ({ insectID: i.insectID, insectName: '' })),
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chemicalId) return;

    const hasImage = Boolean(imageFile || (existingImageUrl && !imageRemoved));
    const validationErrors = validateChemicalForm(
      formData,
      targetInsects.length,
      hasImage,
      imageFile
    );
    if (validationErrors.length > 0) {
      setStatus({
        state: 'error',
        message: `กรุณาแก้ไขข้อมูลต่อไปนี้: ${validationErrors.join(' / ')}`,
      });
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
            imageWarning = imgErrText || `HTTP ${imgRes.status}`;
          } else {
            const updatedChemical: ChemicalDTO = await imgRes.json().catch(() => null);
            if (updatedChemical?.chemicalImg) {
              setExistingImageUrl(updatedChemical.chemicalImg);
            }
            if (imagePreview) {
              URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(null);
            setImageFile(null);
            setImageRemoved(false);
          }
        } catch {
          imageWarning = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
        }
      }

      if (imageWarning) {
        setStatus({
          state: 'error',
          message: `บันทึกข้อมูลหลักสำเร็จ แต่การเปลี่ยนรูปภาพไม่สำเร็จ (${imageWarning})`,
        });
        return;
      }

      setStatus({
        state: 'success',
        message: 'อัปเดตข้อมูลสารเคมีสำเร็จ',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || insectsLoading;

  if (pageState === 'loading') {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-5 h-5 animate-spin text-[#2D7048]" />
        <span>กำลังโหลดข้อมูลสารเคมี...</span>
      </div>
    );
  }

  if (pageState === 'notFound') {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-6 font-sans">
        <div className="bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
          <h2 className="text-sm font-bold text-[#1A1F1C]">ไม่พบข้อมูลสารเคมีนี้</h2>
          <p className="text-xs text-[#5A635D]">สารเคมีนี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <button
            onClick={() => router.push('/admin/listadminchemicals')}
            className="mt-2 px-4 py-2 text-xs font-medium text-white bg-[#2D7048] rounded-md hover:bg-[#25593A] transition-colors cursor-pointer"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'loadError') {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-6 font-sans">
        <div className="bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-8 space-y-3 text-xs text-[#B42318] font-semibold">
          <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
          <p>{loadErrorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-xs font-medium text-[#1A1F1C] bg-white border border-[#CDD2CF] rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

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
            แก้ไขข้อมูลสารเคมี
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            ปรับปรุงรายละเอียดสูตร สารออกฤทธิ์ อัตราการใช้ และคำแนะนำความปลอดภัย
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Left Column: Image Upload */}
        <div className="md:col-span-5 bg-white border border-[#E3E6E4] rounded-lg p-6 space-y-4">
          <ImageUpload
            label="ภาพบรรจุภัณฑ์สารเคมี"
            description="อัปเดตภาพฉลากหรือบรรจุภัณฑ์"
            mode="single"
            existingImageUrl={imageRemoved ? null : existingImageUrl}
            selectedFile={imageFile}
            previewUrl={imagePreview}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            maxSizeBytes={10 * 1024 * 1024}
            helperText="PNG, JPG, WEBP (สูงสุด 10MB)"
          />
        </div>

        {/* Right Column: Key Details */}
        <div className="md:col-span-7 bg-white border border-[#E3E6E4] rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight text-[#1A1F1C]">
              แก้ไขข้อมูลสารเคมีกำจัดแมลง
            </h2>
            <p className="text-xs text-[#5A635D] mt-1">
              ปรับปรุงรายละเอียดสูตร สารออกฤทธิ์ และอัตราการใช้
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
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Active Ingredient */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ส่วนประกอบสำคัญ <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.activeIngredient}
                onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs italic text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
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
                  <option value="" disabled>เลือกระดับ...</option>
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
                  <option value="" disabled>เลือกวิธีการใช้งาน...</option>
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
                  className="flex-1 px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs font-semibold text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
                />
                <select
                  value={formData.dosageUnit}
                  onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}
                  className="w-48 px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
                >
                  <option value="" disabled>หน่วย...</option>
                  <option value="ml/rai">มล./ไร่</option>
                  <option value="L/rai">ล./ไร่</option>
                  <option value="g/rai">ก./ไร่</option>
                  <option value="kg/rai">กก./ไร่</option>
                  <option value="ml/20L">มล./น้ำ 20 ลิตร</option>
                  <option value="g/20L">ก./น้ำ 20 ลิตร</option>
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
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Target Pests */}
            <div ref={wrapperRef} className="pt-3 border-t border-[#E3E6E4]">
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                แมลงเป้าหมาย <span className="text-[#B42318]">*</span>
              </label>

              {insectsError && <p className="text-xs text-[#B42318] mb-1">{insectsError}</p>}

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
                    placeholder={insectsLoading ? 'กำลังโหลดรายชื่อแมลง...' : 'เพิ่มแมลง...'}
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
                    ไม่พบรายชื่อแมลงที่คุณค้นหา
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="pt-3 border-t border-[#E3E6E4]">
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                คำแนะนำสำหรับการใช้งานและอัตราผสม <span className="text-[#B42318]">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] resize-none"
              />
            </div>

            {/* Warnings */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                คำเตือนและข้อควรระวังความปลอดภัย <span className="text-[#B42318]">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.warning}
                onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] resize-none"
              />
            </div>

            {/* Status message */}
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

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3E6E4]">
              <button
                type="button"
                onClick={() => router.push('/admin/listadminchemicals')}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-medium text-[#1A1F1C] bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] rounded-md transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-9 px-4 text-xs font-medium text-white bg-[#2D7048] hover:bg-[#25593A] rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'อัปเดตข้อมูลสารเคมี'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default function EditChemicalPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
          <Loader2 className="w-5 h-5 animate-spin text-[#2D7048]" />
          <span>กำลังโหลด...</span>
        </div>
      }
    >
      <EditChemicalForm />
    </Suspense>
  );
}