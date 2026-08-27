'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { Upload, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
// วิธีนี้ทำให้สลับ URL ระหว่าง local/production ได้โดยไม่ต้องแก้โค้ด
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
  insectImg?: string; // response เท่านั้น = URL, request ไม่ต้องส่ง (รูปแยกเป็น MultipartFile)
  riceGrowthStages: Pick<RiceGrowthStageDTO, 'stageID'>[];
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface Status {
  state: SubmitState;
  message: string;
}

interface InsectFormProps {
  // ถ้ามีค่า -> โหมดแก้ไข (PUT /{id}), ถ้าไม่มี -> โหมดสร้างใหม่ (POST)
  insectId?: string;
}

const initialFormData: InsectFormData = {
  commonName: 'เพลี้ยกระโดดสีน้ำตาล',
  scientificName: 'Nilaparvata lugens',
  selectedStageIDs: [],
  dangerLevel: '',
  category: 'Nilaparvata lugens',
  description: '',
};

export default function InsectForm({ insectId }: InsectFormProps) {
  const [formData, setFormData] = useState<InsectFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });

  const [stages, setStages] = useState<RiceGrowthStageDTO[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState<string | null>(null);

  // โหลดรายการระยะการเจริญเติบโตของข้าวจาก backend แบบ dynamic
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
  };

  // เคลียร์ blob URL เดิมทุกครั้งที่มีการเปลี่ยนรูป หรือตอน unmount ป้องกัน memory leak
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleReset = () => {
    setFormData(initialFormData);
    setImageFile(null);
    setImagePreview(null);
    setStatus({ state: 'idle', message: '' });
  };

  const buildPayload = (): Omit<InsectDTO, 'insectID' | 'insectImg'> => ({
    insectName: formData.commonName,
    scientificName: formData.scientificName,
    insectType: formData.category,
    dangerLevel: formData.dangerLevel,
    insectDes: formData.description,
    // ตอน add/edit backend รับแค่ stageID ต่อ object พอ
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
      const isEdit = Boolean(insectId);
      const url = isEdit ? `${API_BASE_URL}/${insectId}` : API_BASE_URL;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `บันทึกไม่สำเร็จ (HTTP ${res.status})`);
      }

      const saved: InsectDTO = await res.json();

      // insectImg รับเป็น MultipartFile แยกต่างหาก (ไม่ได้อยู่ใน InsectDTO ตอน request)
      // TODO: ยืนยัน path endpoint จริงจาก InsectController / InsectService
      // สมมติไว้ก่อนว่าเป็น POST /api/v1/insects/{insectID}/image
      if (imageFile && saved?.insectID) {
        const imgForm = new FormData();
        imgForm.append('image', imageFile);
        await fetch(`${API_BASE_URL}/${saved.insectID}/image`, {
          method: 'POST',
          body: imgForm,
        }).catch(() => {
          // ไม่ให้ error รูปภาพบล็อกการแจ้งผลสำเร็จของข้อมูลหลัก
        });
      }

      setStatus({
        state: 'success',
        message: isEdit ? 'อัปเดตข้อมูลแมลงสำเร็จ' : 'บันทึกข้อมูลแมลงลงฐานข้อมูลสำเร็จ',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      setStatus({ state: 'error', message });
    }
  };

  const isLoading = status.state === 'loading';
  const isSubmitDisabled = isLoading || stagesLoading;

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8 flex items-center justify-center font-sans text-slate-700">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Left Column: Image Upload */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-fit">
          <div>
            <h2 className="text-base font-bold text-slate-800">ภาพแมลง</h2>
            <p className="text-xs text-slate-400 mt-1">
              โปรดอัปโหลดรูปภาพอ้างอิงที่มีความคมชัดและความละเอียดสูง
            </p>
          </div>

          <label className="mt-6 relative border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[320px] hover:border-emerald-300 transition-colors cursor-pointer group overflow-hidden">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              // blob: URL จาก URL.createObjectURL ไม่ใช่ static/remote asset
              // จึงต้องใช้ unoptimized เพราะ Next Image Optimizer จัดการ blob URL ไม่ได้
              <Image
                src={imagePreview}
                alt="ตัวอย่างภาพแมลง"
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
                  Click or drag image to upload
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
            <h2 className="text-base font-bold text-slate-800">รายละเอียดแมลง</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">ข้อมูลการจำแนกขั้นพื้นฐาน</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อสามัญ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.commonName}
                  onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Scientific Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อวิทยาศาสตร์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.scientificName}
                  onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Rice Growth Stage */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  ระยะการเจริญเติบโตของข้าว <span className="text-red-500">*</span>
                </label>

                {stagesLoading && (
                  <p className="text-xs text-slate-400">กำลังโหลดรายการระยะ...</p>
                )}

                {stagesError && (
                  <p className="text-xs text-red-500">{stagesError}</p>
                )}

                {!stagesLoading && !stagesError && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-medium">
                    {stages.map((stage) => (
                      <label key={stage.stageID} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedStageIDs.includes(stage.stageID)}
                          onChange={(e) => toggleStage(stage.stageID, e.target.checked)}
                          className="w-4 h-4 rounded accent-slate-800"
                        />
                        <span>{stage.stageName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Level */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ระดับอันตราย <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.dangerLevel}
                  onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value as DangerLevel })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="">เลือกระดับ...</option>
                  <option value="low">ต่ำ</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="high">สูง</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ประเภทแมลง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คำอธิบายและข้อสังเกตเกี่ยวกับพฤติกรรม <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="อธิบายลักษณะทางกายภาพและพฤติกรรมทั่วไป..."
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
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-6 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  ล้าง
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2b3648] hover:bg-[#1e2736] rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกลงฐานข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}