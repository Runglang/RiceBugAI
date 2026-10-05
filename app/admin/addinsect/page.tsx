'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Save, Loader2, CheckCircle2, AlertCircle, X, ChevronLeft } from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/insects`;
const STAGES_API_URL = `${API_ORIGIN}/api/v1/rice-growth-stages`;

type DangerLevel = '' | 'low' | 'medium' | 'high';

interface InsectFormData {
  commonName: string;
  scientificName: string;
  selectedStageIDs: string[];
  dangerLevel: DangerLevel;
  category: string;
  description: string;
}

interface RiceGrowthStageDTO {
  stageID: string;
  stageName: string;
  stageDes: string;
  durationRange: string;
}

interface InsectDTO {
  insectID?: string;
  insectName: string;
  scientificName: string;
  insectType: string;
  dangerLevel: DangerLevel;
  insectDes: string;
  insectImg?: string[];
  riceGrowthStages: Pick<RiceGrowthStageDTO, 'stageID'>[];
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface Status {
  state: SubmitState;
  message: string;
}

const initialFormData: InsectFormData = {
  commonName: '',
  scientificName: '',
  selectedStageIDs: [],
  dangerLevel: '',
  category: '',
  description: '',
};

export default function InsectForm() {
  const [formData, setFormData] = useState<InsectFormData>(initialFormData);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

  const [stages, setStages] = useState<RiceGrowthStageDTO[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStages() {
      try {
        const res = await fetch(STAGES_API_URL, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RiceGrowthStageDTO[] = await res.json();
        if (!controller.signal.aborted) setStages(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!controller.signal.aborted) {
          setStagesError(err instanceof Error ? err.message : 'โหลดระยะการเจริญเติบโตไม่สำเร็จ');
        }
      } finally {
        if (!controller.signal.aborted) setStagesLoading(false);
      }
    }

    fetchStages();
    return () => { controller.abort(); };
  }, []);

  const toggleStage = (stageID: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedStageIDs: checked
        ? [...prev.selectedStageIDs, stageID]
        : prev.selectedStageIDs.filter((id) => id !== stageID),
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));

    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleReset = () => {
    setFormData(initialFormData);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setStatus({ state: 'idle', message: '' });
  };

  const buildPayload = (): Omit<InsectDTO, 'insectID' | 'insectImg'> => ({
    insectName: formData.commonName,
    scientificName: formData.scientificName,
    insectType: formData.category,
    dangerLevel: formData.dangerLevel,
    insectDes: formData.description,
    riceGrowthStages: formData.selectedStageIDs.map((stageID) => ({ stageID })),
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.commonName ||
      !formData.scientificName ||
      !formData.dangerLevel ||
      !formData.category ||
      formData.selectedStageIDs.length === 0
    ) {
      setStatus({ state: 'error', message: 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน' });
      return;
    }

    setStatus({ state: 'loading', message: '' });

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
      }

      const saved: InsectDTO = await res.json();

      if (imageFiles.length > 0 && saved?.insectID) {
        for (const file of imageFiles) {
          const imgForm = new FormData();
          imgForm.append('image', file);
          await fetch(`${API_BASE_URL}/${saved.insectID}/image`, {
            method: 'POST',
            body: imgForm,
          }).catch(() => {});
        }
      }

      setStatus({
        state: 'success',
        message: 'บันทึกข้อมูลแมลงลงฐานข้อมูลสำเร็จ',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isLoading = status.state === 'loading';
  const isSubmitDisabled = isLoading || stagesLoading;

  return (
    <div className="space-y-6 font-sans">

      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#E3E6E4]">
        <div className="flex items-center gap-2 text-xs text-[#5A635D]">
          <Link href="/admin/dashboard" className="hover:text-[#1A1F1C] transition-colors">แดชบอร์ด</Link>
          <span>/</span>
          <Link href="/admin/listadmininsects" className="hover:text-[#1A1F1C] transition-colors">จัดการข้อมูลแมลง</Link>
          <span>/</span>
          <span className="text-[#1A1F1C] font-semibold">เพิ่มทะเบียนแมลง</span>
        </div>

        <Link
          href="/admin/listadmininsects"
          className="inline-flex items-center gap-1.5 text-xs text-[#5A635D] hover:text-[#1A1F1C] transition-colors font-medium cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>ย้อนกลับ</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Left Column: Image Uploader */}
        <div className="md:col-span-5 bg-white border border-[#E3E6E4] rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#1A1F1C]">ภาพตัวอย่างสัณฐานวิทยา</h2>
            <p className="text-xs text-[#5A635D] mt-1">
              สามารถอัปโหลดรูปภาพได้หลายรูปสำหรับฐานข้อมูล
            </p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-[#E3E6E4] bg-[#F1F3F2] group">
                  <Image
                    src={preview}
                    alt={`ตัวอย่างภาพ ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-[#B42318] text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="border border-dashed border-[#CDD2CF] bg-[#F7F8F7] hover:bg-[#F1F3F2] rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            <div className="w-10 h-10 rounded-full bg-[#F0F7F2] text-[#2D7048] border border-[#B9DBC6] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload size={16} />
            </div>
            <p className="text-xs font-semibold text-[#1A1F1C] mb-0.5">
              คลิกเพื่อเลือกไฟล์รูปภาพ
            </p>
            <p className="text-[11px] text-[#5A635D]">
              PNG, JPG, WEBP (รองรับหลายไฟล์)
            </p>
          </label>

          {imagePreviews.length > 0 && (
            <p className="text-xs text-[#5A635D] text-center font-medium">
              เลือกแล้ว {imagePreviews.length} รูป
            </p>
          )}
        </div>

        {/* Right Column: Taxonomy & Biological Profile */}
        <div className="md:col-span-7 bg-white border border-[#E3E6E4] rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-lg font-bold tracking-tight text-[#1A1F1C]">
              ข้อมูลสัณฐานวิทยาและชีววิทยา
            </h1>
            <p className="text-xs text-[#5A635D] mt-1">
              กรอกข้อมูลรายละเอียดทางอนุกรมวิธานและระยะการเข้าทำลาย
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Common Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ชื่อสามัญ <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.commonName}
                onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                placeholder="เช่น เพลี้ยกระโดดสีน้ำตาล"
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Scientific Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ชื่อวิทยาศาสตร์ <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.scientificName}
                onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                placeholder="เช่น Nilaparvata lugens (Stål)"
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs italic text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ประเภทแมลง <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="เช่น เพลี้ย, หนอนกอ, มวน, ด้วงดำ"
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
              />
            </div>

            {/* Danger Level */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                ระดับอันตราย <span className="text-[#B42318]">*</span>
              </label>
              <div className="flex items-center gap-4 pt-1">
                {[
                  { value: 'low', label: 'ระดับต่ำ' },
                  { value: 'medium', label: 'ปานกลาง' },
                  { value: 'high', label: 'ระดับสูง' },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-1.5 cursor-pointer text-xs text-[#3F4742]">
                    <input
                      type="radio"
                      name="dangerLevel"
                      value={item.value}
                      checked={formData.dangerLevel === item.value}
                      onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value as DangerLevel })}
                      className="accent-[#2D7048]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rice Growth Stage */}
            <div className="pt-3 border-t border-[#E3E6E4]">
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-2">
                ระยะการเจริญเติบโตของข้าวที่เข้าทำลาย <span className="text-[#B42318]">*</span>
              </label>

              {stagesLoading && (
                <p className="text-xs text-[#5A635D]">กำลังโหลดรายการระยะข้าว...</p>
              )}

              {stagesError && (
                <p className="text-xs text-[#B42318]">{stagesError}</p>
              )}

              {!stagesLoading && !stagesError && (
                <div className="grid grid-cols-2 gap-2 text-xs text-[#3F4742]">
                  {stages.map((stage) => (
                    <label key={stage.stageID} className="flex items-center gap-2 cursor-pointer bg-[#F7F8F7] hover:bg-[#F1F3F2] p-2.5 rounded-md border border-[#E3E6E4] transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.selectedStageIDs.includes(stage.stageID)}
                        onChange={(e) => toggleStage(stage.stageID, e.target.checked)}
                        className="accent-[#2D7048]"
                      />
                      <span className="font-medium text-xs text-[#1A1F1C]">{stage.stageName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-[#E3E6E4]">
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1.5">
                คำอธิบายลักษณะการเข้าทำลายและพฤติกรรม
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายลักษณะทางสัณฐาน รูปร่าง และลักษณะการเข้าทำลายต้นข้าว..."
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
                disabled={isLoading}
                className="h-9 px-4 text-xs font-medium text-[#1A1F1C] bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] rounded-md transition-colors cursor-pointer"
              >
                ล้างฟอร์ม
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-9 px-4 text-xs font-medium text-white bg-[#2D7048] hover:bg-[#25593A] rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลแมลง'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
