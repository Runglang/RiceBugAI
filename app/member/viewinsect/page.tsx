'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ZoomIn, Loader2, AlertCircle, X } from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/insects`;

const DANGER_LABEL: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
};

const DANGER_STYLE: Record<string, string> = {
  low: 'text-emerald-700',
  medium: 'text-amber-700',
  high: 'text-red-700',
};

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.RiceGrowthStageDTO
interface RiceGrowthStageDTO {
  stageID: string;
  stageName: string;
  stageDes: string;
  durationRange: string;
}

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.InsectDTO
interface InsectDTO {
  insectID: string;
  insectName: string;
  scientificName: string;
  insectType: string;
  dangerLevel: string;
  insectDes: string;
  insectImg?: string | null;
  riceGrowthStages: RiceGrowthStageDTO[];
}

type PageState = 'loading' | 'ready' | 'notFound' | 'loadError';

function ViewInsectContent() {
  const searchParams = useSearchParams();
  const insectId = searchParams.get('id') ?? undefined;
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>(insectId ? 'loading' : 'notFound');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');
  const [insect, setInsect] = useState<InsectDTO | null>(null);

  // State ควบคุม Modal ขยายรูปภาพ
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // โหลดข้อมูลแมลงจาก API
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

        setInsect(data);
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

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        กำลังโหลดข้อมูลแมลง...
      </div>
    );
  }

  // Not Found
  if (pageState === 'notFound') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-gray-600">ไม่พบข้อมูลแมลงนี้ อาจถูกลบไปแล้ว</p>
        <button
          onClick={() => router.push('/member/listinsects')}
          className="px-4 py-2 text-xs bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          กลับไปหน้ารายการ
        </button>
      </div>
    );
  }

  // Error
  if (pageState === 'loadError') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{loadErrorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // ถ้า pageState === 'ready' แต่ insect เป็น null (กรณีไม่น่าเกิด)
  if (!insect) return null;

  const stagesText = insect.riceGrowthStages?.length
    ? insect.riceGrowthStages.map((s) => s.stageName).join(', ')
    : 'ไม่ระบุ';

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-4 sm:p-8 md:p-12 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Left Column: Image Viewer */}
          <div className="w-full lg:w-3/5 relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-[4/3] lg:aspect-auto group cursor-pointer" onClick={() => insect.insectImg && setIsImageModalOpen(true)}>
            {insect.insectImg ? (
              <Image
                src={insect.insectImg}
                alt={insect.insectName}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] flex items-center justify-center text-gray-400 text-sm">
                ไม่มีรูปภาพ
              </div>
            )}

            {/* Floating Action Buttons (Zoom & Expand) */}
            {insect.insectImg && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageModalOpen(true);
                  }}
                  className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Info Card */}
          <div className="w-full lg:w-2/5">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 rounded-xl h-full flex flex-col">

              {/* Header Title */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
                  {insect.insectName}
                </h1>
                <p className="text-sm text-gray-400 font-medium">{insect.scientificName}</p>
              </div>

              <hr className="border-gray-200 mb-6" />

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 mb-1">ประเภทแมลง</span>
                  <span className="block text-sm font-bold text-gray-800">{insect.insectType}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 mb-1">ระดับความอันตราย</span>
                  <span className={`block text-sm font-bold ${DANGER_STYLE[insect.dangerLevel] ?? 'text-gray-800'}`}>
                    {DANGER_LABEL[insect.dangerLevel] ?? insect.dangerLevel}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 mb-1">ระยะการเจริญเติบโตของข้าว</span>
                  <span className="block text-sm font-bold text-gray-800">{stagesText}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 mb-1">ชื่อวิทยาศาสตร์</span>
                  <span className="block text-sm font-bold text-gray-800">{insect.scientificName}</span>
                </div>
              </div>

              <hr className="border-gray-200 mb-6" />

              {/* Description */}
              <div className="flex-grow overflow-hidden">
                <h2 className="text-sm font-bold text-gray-900 mb-3">รายละเอียด</h2>
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap break-words break-all">
                  {insect.insectDes || 'ไม่มีรายละเอียด'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && insect.insectImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative w-full max-w-5xl aspect-square md:aspect-video rounded-xl overflow-hidden">
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <Image
              src={insect.insectImg}
              alt={insect.insectName}
              fill
              unoptimized
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewInsectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลด...
        </div>
      }
    >
      <ViewInsectContent />
    </Suspense>
  );
}
