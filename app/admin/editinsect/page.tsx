'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/shared/ImageUpload';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const insectId = searchParams.get('insectId') || searchParams.get('id') || undefined;
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');

  const [formData, setFormData] = useState<InsectFormData>(emptyFormData);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [stages, setStages] = useState<RiceGrowthStageDTO[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

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

  useEffect(() => {
    if (!insectId) {
      return;
    }

    const controller = new AbortController();

    async function loadInsect() {
      try {
        const res = await fetch(`${API_BASE_URL}/${insectId}`, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setPageState('notFound');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: InsectDTO = await res.json();
        if (controller.signal.aborted) return;

        setFormData({
          commonName: data.insectName || '',
          scientificName: data.scientificName || '',
          selectedStageIDs: data.riceGrowthStages?.map((s) => s.stageID) || [],
          dangerLevel: data.dangerLevel || '',
          category: data.insectType || '',
          description: data.insectDes || '',
        });
        setExistingImageUrls(data.insectImg ?? []);
        setPageState('ready');
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadErrorMsg(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
          setPageState('loadError');
        }
      }
    }

    loadInsect();
    return () => { controller.abort(); };
  }, [insectId]);

  const toggleStage = (stageID: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedStageIDs: checked
        ? [...prev.selectedStageIDs, stageID]
        : prev.selectedStageIDs.filter((id) => id !== stageID),
    }));
  };

  const handleFilesAdd = (newFiles: File[]) => {
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const buildPayload = (): Omit<InsectDTO, 'insectID'> => ({
    insectName: formData.commonName,
    scientificName: formData.scientificName,
    insectType: formData.category,
    dangerLevel: formData.dangerLevel,
    insectDes: formData.description,
    riceGrowthStages: formData.selectedStageIDs.map((stageID) => ({ stageID })),
    insectImg: existingImageUrls,
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

      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const imgForm = new FormData();
          imgForm.append('image', file);
          await fetch(`${API_BASE_URL}/${insectId}/image`, {
            method: 'POST',
            body: imgForm,
          }).catch(() => {});
        }
      }

      setStatus({
        state: 'success',
        message: 'อัปเดตข้อมูลแมลงในระบบเรียบร้อยแล้ว',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isSubmitting = status.state === 'loading';
  const isSubmitDisabled = isSubmitting || stagesLoading;

  if (!insectId || pageState === 'notFound') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
        <p className="text-sm font-semibold text-[#B42318]">ไม่พบข้อมูลแมลงนี้ในระบบ (อาจถูกลบไปแล้ว)</p>
        <button
          onClick={() => router.push('/admin/listadmininsects')}
          className="px-4 py-2 text-xs bg-white border border-[#CDD2CF] text-[#1A1F1C] font-medium rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
        >
          กลับไปหน้ารายการ
        </button>
      </div>
    );
  }

  if (pageState === 'loading') {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
        <span>กำลังโหลดข้อมูลทะเบียนแมลง...</span>
      </div>
    );
  }

  if (pageState === 'loadError') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
        <p className="text-sm text-[#B42318] font-semibold">{loadErrorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs bg-white border border-[#CDD2CF] text-[#1A1F1C] font-medium rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Left Column: Image Management */}
        <div className="md:col-span-5 bg-white border border-[#E3E6E4] rounded-lg p-6 space-y-4">
          <ImageUpload
            label="จัดการรูปภาพสัณฐานวิทยา"
            description="รูปภาพที่มีอยู่ในระบบ และสามารถอัปโหลดรูปภาพใหม่เพิ่มเติมได้"
            mode="multiple"
            existingImageUrls={existingImageUrls}
            onExistingRemoveIndex={removeExistingImage}
            selectedFiles={imageFiles}
            previewUrls={imagePreviews}
            onFilesAdd={handleFilesAdd}
            onFileRemoveIndex={removeNewImage}
            helperText="PNG, JPG, WEBP (รองรับหลายไฟล์)"
          />
        </div>

        {/* Right Column: Taxonomy Details */}
        <div className="md:col-span-7 bg-white border border-[#E3E6E4] rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-lg font-bold tracking-tight text-[#1A1F1C]">
              แก้ไขข้อมูลสัณฐานวิทยาและชีววิทยา
            </h1>
            <p className="text-xs text-[#5A635D] mt-1">
              ปรับปรุงรายละเอียดทางอนุกรมวิธานและระยะการเข้าทำลาย
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
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
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
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs italic text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
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
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
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
                className="w-full px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] resize-none"
              />
            </div>

            {/* Feedback */}
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
                onClick={() => router.push('/admin/listadmininsects')}
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
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'อัปเดตข้อมูลแมลง'}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default function EditInsectPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
          <span>กำลังโหลด...</span>
        </div>
      }
    >
      <EditInsectForm />
    </Suspense>
  );
}
