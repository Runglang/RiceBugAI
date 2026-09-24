'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ZoomIn, Loader2, AlertCircle, X, Bug } from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/chemicals`;

const TOXICITY_LABEL: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
};

const TOXICITY_STYLE: Record<string, string> = {
  low: 'text-emerald-700',
  medium: 'text-amber-700',
  high: 'text-red-700',
};

interface InsectRefDTO {
  insectID: string;
  insectName: string;
  scientificName: string;
  insectImg?: string | null;
}

interface ChemicalDTO {
  chemicalID: string;
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
  targetInsects: InsectRefDTO[];
}

type PageState = 'loading' | 'ready' | 'notFound' | 'loadError';

function ChemicalDetailContent() {
  const searchParams = useSearchParams();
  const chemicalId = searchParams.get('id') ?? undefined;
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>(chemicalId ? 'loading' : 'notFound');
  const [loadErrorMsg, setLoadErrorMsg] = useState('');
  const [chemical, setChemical] = useState<ChemicalDTO | null>(null);

  // State ควบคุม Modal ขยายรูปภาพ
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // โหลดข้อมูลจาก API
  useEffect(() => {
    if (!chemicalId) return;

    const controller = new AbortController();

    async function loadChemical() {
      try {
        const res = await fetch(`${API_BASE_URL}/${chemicalId}`, { signal: controller.signal });
        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setPageState('notFound');
          return;
        }
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);

        const data: ChemicalDTO = await res.json();
        if (controller.signal.aborted) return;

        setChemical(data);
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

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        กำลังโหลดข้อมูลสารเคมี...
      </div>
    );
  }

  // Not Found
  if (pageState === 'notFound') {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-gray-600">ไม่พบข้อมูลสารเคมีนี้ อาจถูกลบไปแล้ว</p>
        <button
          onClick={() => router.push('/member/listchemicals')}
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

  if (!chemical) return null;

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-4 sm:p-8 md:p-10 font-sans text-gray-800 flex justify-center">
      <div className="max-w-4xl w-full flex flex-col gap-6">

        {/* Section 1: Main Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row gap-8">
          {/* Image */}
          <div
            className="w-full md:w-1/3 aspect-[3/4] bg-gray-200 rounded-xl overflow-hidden relative flex shrink-0 items-center justify-center group cursor-pointer"
            onClick={() => chemical.chemicalImg && setIsImageModalOpen(true)}
          >
            {chemical.chemicalImg ? (
              <Image
                src={chemical.chemicalImg}
                alt={chemical.chemicalName}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="text-gray-400 text-sm">ไม่มีรูปภาพ</div>
            )}

            {/* Zoom Button Overlay */}
            {chemical.chemicalImg && (
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

          {/* Details */}
          <div className="w-full md:w-2/3 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 tracking-tight">
              {chemical.chemicalName}
            </h1>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">ส่วนประกอบสำคัญ</span>
                <span className="block text-sm font-semibold text-gray-700">{chemical.activeIngredient}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">คุณสมบัติ</span>
                <span className="block text-sm font-semibold text-gray-700">{chemical.property}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">วิธีการใช้</span>
                <span className="block text-sm font-semibold text-gray-700">{chemical.usageMethod}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">ระดับความเป็นพิษ</span>
                <span className={`block text-sm font-bold ${TOXICITY_STYLE[chemical.toxicityLevel] ?? 'text-gray-700'}`}>
                  {TOXICITY_LABEL[chemical.toxicityLevel] ?? chemical.toxicityLevel}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">ปริมาณการใช้</span>
                <span className="block text-sm font-semibold text-gray-700">
                  {chemical.dosageRate} {chemical.dosageUnit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 mb-4">คำอธิบาย</h2>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap break-words break-all">
            {chemical.description || 'ไม่มีคำอธิบาย'}
          </p>
        </div>

        {/* Section 3: Warning */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 mb-4">คำเตือน</h2>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap break-words break-all">
            {chemical.warning || 'ไม่มีคำเตือน'}
          </p>
        </div>

        {/* Section 4: Target Pests */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">แมลงเป้าหมาย</h2>

          {chemical.targetInsects && chemical.targetInsects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {chemical.targetInsects.map((pest) => (
                <div
                  key={pest.insectID}
                  onClick={() => router.push(`/member/viewinsect?id=${pest.insectID}`)}
                  className="relative h-40 rounded-xl overflow-hidden bg-gray-100 flex flex-col items-center justify-end p-4 group cursor-pointer hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  {pest.insectImg ? (
                    <Image
                      src={pest.insectImg}
                      alt={pest.insectName}
                      fill
                      unoptimized
                      className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                    />
                  ) : (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-300">
                      <Bug className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  <div className="relative z-10 text-center w-full mt-auto">
                    <h3 className="text-white text-xs font-bold truncate drop-shadow-md">
                      {pest.insectName}
                    </h3>
                    <p className="text-white/80 text-[10px] font-medium truncate drop-shadow-sm mt-0.5">
                      {pest.scientificName || 'ไม่มีชื่อวิทยาศาสตร์'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-400">
              ไม่มีข้อมูลแมลงเป้าหมาย
            </div>
          )}
        </div>

      </div>

      {/* Image Modal */}
      {isImageModalOpen && chemical.chemicalImg && (
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
              src={chemical.chemicalImg}
              alt={chemical.chemicalName}
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

export default function ChemicalDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3F5F1] flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลด...
        </div>
      }
    >
      <ChemicalDetailContent />
    </Suspense>
  );
}
