'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronRight, Upload, Trash2, HelpCircle, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
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

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO
interface RiceGrowthStageDTO {
  stageID: string;
  stageName: string;
  stageDes: string;
  durationRange: string;
}

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.InsectDTO
interface InsectDTO {
  insectID?: string;
  insectName: string;
  scientificName: string;
  insectType: string;
  dangerLevel: DangerLevel;
  insectDes: string;
  insectImg?: string | null; // response = URL, request = ไม่ต้องส่ง (รูปแยกเป็น MultipartFile)
  riceGrowthStages: Pick<RiceGrowthStageDTO, 'stageID'>[];
}

type PageState = 'loading' | 'ready' | 'notFound' | 'loadError';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface Status {
  state: SubmitState;
  message: string;
}

const emptyFormData: InsectFormData = {
  commonName: '',
  scientificName: '',
  selectedStageIDs: [],
  dangerLevel: '',
  category: '',
  description: '',
};

function EditInsectForm() {
  const searchParams = useSearchParams();
  const insectId = searchParams.get('insectId') ?? undefined;
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');

  const [formData, setFormData] = useState<InsectFormData>(emptyFormData);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [stages, setStages] = useState<RiceGrowthStageDTO[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

  // โหลดรายการระยะการเจริญเติบโตของข้าว
  useEffect(() => {
    const controller = new AbortController();

    async function fetchStages() {
      try {
        const res = await fetch(STAGES_API_URL, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (!res.ok) throw new Error(`โหลดระยะการเจริญเติบโตไม่สำเร็จ (HTTP ${res.status})`);
        const data: RiceGrowthStageDTO[] = await res.json();

        if (!controller.signal.aborted) setStages(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setStagesError(err instanceof Error ? err.message : 'โหลดระยะการเจริญเติบโตไม่สำเร็จ');
        }
      } finally {
        if (!controller.signal.aborted) setStagesLoading(false);
      }
    }

    fetchStages();

    return () => {
      controller.abort();
    };
  }, []);

  // โหลดข้อมูลแมลงเดิมมา prefill ฟอร์ม
  useEffect(() => {
    if (!insectId) return;

    const controller = new AbortController();

    async function loadInsect() {
      try {
        const res = await fetch(`${API_BASE_URL}/${insectId}`, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setPageState('notFound');
          return;
        }
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);

        const data: InsectDTO = await res.json();
        if (controller.signal.aborted) return;

        setFormData({
          commonName: data.insectName,
          scientificName: data.scientificName,
          selectedStageIDs: data.riceGrowthStages.map((s) => s.stageID),
          dangerLevel: data.dangerLevel,
          category: data.insectType,
          description: data.insectDes,
        });
        setExistingImageUrl(data.insectImg ?? null);
        setPageState('ready');
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadErrorMsg(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
          setPageState('loadError');
        }
      }
    }

    loadInsect();

    return () => {
      controller.abort();
    };
  }, [insectId]);

  const toggleStage = (stageID: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedStageIDs: checked
        ? [...prev.selectedStageIDs, stageID]
        : prev.selectedStageIDs.filter((id) => id !== stageID),
    }));
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

  // หมายเหตุ: ตอนนี้ backend ยังไม่มี endpoint สำหรับ "ลบรูปภาพ" โดยเฉพาะ
  // ปุ่มนี้แค่เคลียร์ preview ในหน้าจอ ไม่ได้ลบไฟล์ออกจาก DB จริง
  // ถ้าจะให้ลบได้จริง ต้องเพิ่ม endpoint เช่น DELETE /api/v1/insects/{id}/image ฝั่ง backend
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
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
    if (!insectId) return;

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
      const res = await fetch(`${API_BASE_URL}/${insectId}`, {
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
          const imgRes = await fetch(`${API_BASE_URL}/${insectId}/image`, {
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
        message: 'อัปเดตข้อมูลแมลงสำเร็จ' + imageWarning,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || stagesLoading;

  // แสดงรูป: ถ้าเพิ่งเลือกรูปใหม่ -> โชว์ preview / ถ้ากดลบ -> โชว์ placeholder / ไม่งั้นโชว์รูปเดิมจาก backend
  const displayImageUrl = imagePreview ?? (imageRemoved ? null : existingImageUrl);

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        กำลังโหลดข้อมูลแมลง...
      </div>
    );
  }

  if (pageState === 'notFound') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-slate-600">ไม่พบข้อมูลแมลงนี้ อาจถูกลบไปแล้ว</p>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          กลับไปหน้ารายการ
        </button>
      </div>
    );
  }

  if (pageState === 'loadError') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{loadErrorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 md:p-12 font-sans text-slate-800 flex justify-center">
      <div className="max-w-4xl w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center text-xs font-medium text-slate-400 mb-6 gap-2">
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/'); }} className="hover:text-slate-700 transition-colors">หน้าแรก</a>
          <ChevronRight className="w-3 h-3" />
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/admin'); }} className="hover:text-slate-700 transition-colors">แมลง</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">แก้ไขข้อมูลแมลง</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1.5">แก้ไขข้อมูลแมลง</h1>
          <p className="text-sm text-slate-500">
            ปรับปรุงข้อมูลด้านอนุกรมวิธาน คำอธิบาย และการระบุลักษณะทางของตัวอย่างนี้
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8">

            {/* Section 1: Image Identification */}
            <section className="mb-10">
              <h2 className="text-sm font-bold text-slate-800 mb-4">การระบุด้วยภาพ</h2>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row gap-6 items-start">

                {/* Image Preview */}
                <div className="w-40 h-40 shrink-0 rounded-lg overflow-hidden bg-slate-200 border border-slate-200 shadow-sm relative">
                  {displayImageUrl ? (
                    <Image
                      src={displayImageUrl}
                      alt={formData.commonName || 'ภาพแมลง'}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                </div>

                {/* Image Info & Actions */}
                <div className="flex flex-col h-full justify-center">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">ภาพตัวอย่างปัจจุบัน</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-5">
                    รูปภาพหลักที่ใช้สำหรับการฝึกอบรม AI และเป็นข้อมูลอ้างอิงของผู้ใช้<br />
                    ขนาดที่แนะนำ: 800×800 พิกเซล
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm cursor-pointer">
                      <Upload className="w-4 h-4" />
                      เปลี่ยนรูปภาพ
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {displayImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100 mb-8" />

            {/* Section 2: Taxonomy & Details */}
            <section>
              <h2 className="text-sm font-bold text-slate-800 mb-6">อนุกรมวิธานและรายละเอียด</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                {/* Common Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ชื่อสามัญ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.commonName}
                    onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-shadow"
                  />
                </div>

                {/* Scientific Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ชื่อวิทยาศาสตร์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.scientificName}
                    onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-shadow"
                  />
                </div>

                {/* Growth Stages */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    ระยะการเจริญเติบโตของข้าว <span className="text-red-500">*</span>
                  </label>

                  {stagesLoading && <p className="text-xs text-slate-400">กำลังโหลดรายการระยะ...</p>}
                  {stagesError && <p className="text-xs text-red-500">{stagesError}</p>}

                  {!stagesLoading && !stagesError && (
                    <div className="flex flex-col gap-2.5 text-xs text-slate-700 font-medium mt-2">
                      {stages.map((stage) => (
                        <label key={stage.stageID} className="flex items-center gap-2 cursor-pointer w-max">
                          <input
                            type="checkbox"
                            checked={formData.selectedStageIDs.includes(stage.stageID)}
                            onChange={(e) => toggleStage(stage.stageID, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer accent-slate-800"
                          />
                          <span>{stage.stageName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger Level */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    ระดับอันตราย <span className="text-red-500">*</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </label>
                  <div className="relative">
                    <select
                      value={formData.dangerLevel}
                      onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value as DangerLevel })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 appearance-none bg-white transition-shadow"
                    >
                      <option value="" disabled>เลือกระดับ...</option>
                      <option value="low">ต่ำ</option>
                      <option value="medium">ปานกลาง</option>
                      <option value="high">สูง</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ประเภทแมลง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-shadow"
                  />
                </div>

                <div className="hidden md:block"></div>

                {/* Description */}
                <div className="md:col-span-2 mt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    คำอธิบาย <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none transition-shadow leading-relaxed"
                  />
                </div>

                {/* Status message */}
                <div className="md:col-span-2">
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
            </section>

            {/* Form Actions Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/listadmininsects')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-slate-800 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? 'กำลังบันทึก...' : 'อัปเดตข้อมูลแมลง'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditInsectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลด...
        </div>
      }
    >
      <EditInsectForm />
    </Suspense>
  );
}