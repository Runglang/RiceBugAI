'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ZoomIn,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/chemicals`;

const TOXICITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: 'ระดับความเป็นพิษสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ระดับความเป็นพิษปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับความเป็นพิษต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

interface InsectRefDTO {
  insectID: string;
  insectName: string;
  scientificName: string;
  insectImg?: string[] | null;
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

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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
    return () => controller.abort();
  }, [chemicalId]);

  if (pageState === 'loading') {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
        <span>กำลังโหลดข้อมูลสารเคมี...</span>
      </div>
    );
  }

  if (pageState === 'notFound') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
        <p className="text-sm font-semibold text-[#B42318]">ไม่พบข้อมูลสารเคมีนี้ในระบบ (อาจถูกลบไปแล้ว)</p>
        <button
          onClick={() => router.push('/member/listchemicals')}
          className="px-4 py-2 text-sm bg-white border border-[#CDD2CF] text-[#1A1F1C] font-medium rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
        >
          กลับไปหน้ารายการสารเคมี
        </button>
      </div>
    );
  }

  if (pageState === 'loadError') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
        <p className="text-sm text-[#B42318]">{loadErrorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm bg-white border border-[#CDD2CF] text-[#1A1F1C] font-medium rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (!chemical) return null;

  const toxicity = TOXICITY_BADGE[chemical.toxicityLevel?.toLowerCase()] || {
    label: chemical.toxicityLevel || 'ทั่วไป',
    className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-5xl mx-auto px-6 pt-8">

        <div className="space-y-8">

          {/* Main Overview Card */}
          <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Left: Image + Target Insects */}
            <div className="md:col-span-5 min-w-0 space-y-4">
              <div
                onClick={() => chemical.chemicalImg && setIsImageModalOpen(true)}
                className={`w-full h-64 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] relative overflow-hidden flex items-center justify-center ${
                  chemical.chemicalImg ? 'cursor-zoom-in group' : ''
                }`}
              >
                {chemical.chemicalImg ? (
                  <>
                    <Image
                      src={chemical.chemicalImg}
                      alt={chemical.chemicalName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1.5 font-medium">
                      <ZoomIn size={16} />
                      <span>คลิกเพื่อขยายภาพ</span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-[#9AA29D]">ไม่มีรูปภาพ</span>
                )}
              </div>

              {/* Target Insects (ย้ายมาไว้ใต้รูป) */}
              <div className="bg-white border border-[#E1E6E2] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] min-w-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-base font-bold text-[#111813]">
                    แมลงเป้าหมายในการควบคุมกำจัด
                  </h3>
                  {chemical.targetInsects && chemical.targetInsects.length > 0 && (
                    <span className="text-xs text-[#156E3B] font-semibold bg-[#E8F6ED] border border-[#B2DEC3] px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {chemical.targetInsects.length} ชนิด
                    </span>
                  )}
                </div>

                {!chemical.targetInsects || chemical.targetInsects.length === 0 ? (
                  <div className="text-xs sm:text-sm text-[#65716A] py-6 text-center bg-[#F8FAF8] rounded-lg border border-[#E1E6E2]">
                    ไม่มีการระบุแมลงเป้าหมายเฉพาะ
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {chemical.targetInsects.map((ins) => {
                      const insectPhoto =
                        Array.isArray(ins.insectImg) && ins.insectImg.length > 0
                          ? ins.insectImg[0]
                          : typeof ins.insectImg === 'string'
                          ? ins.insectImg
                          : null;

                      return (
                        <Link
                          key={ins.insectID}
                          href={`/member/viewinsect?id=${ins.insectID}`}
                          className="group flex items-center gap-3 p-2.5 rounded-lg border border-[#E1E6E2] hover:border-[#2D7048] bg-white hover:bg-[#F8FAF8] transition-all"
                        >
                          <div className="w-12 h-12 rounded-md bg-[#F1F3F2] border border-[#E1E6E2] overflow-hidden relative shrink-0 flex items-center justify-center">
                            {insectPhoto ? (
                              <Image
                                src={insectPhoto}
                                alt={ins.insectName}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[10px] text-[#9AA29D]">ไม่มีรูป</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[#111813] group-hover:text-[#2D7048] transition-colors truncate">
                              {ins.insectName}
                            </div>
                            <div className="text-xs text-[#5A635D] italic truncate">
                              {ins.scientificName || '—'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Chemical Info */}
            <div className="md:col-span-7 min-w-0 flex flex-col justify-between">
              <div className="min-w-0">

                {/* ประเภท + ชื่อ + สารออกฤทธิ์ + อัตราใช้ + คุณสมบัติ (ไม่มีกรอบ) */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <span className="text-sm text-[#5A635D] font-medium">สารเคมีป้องกันกำจัดศัตรูพืช</span>
                    <span className={`px-2.5 py-0.5 rounded-sm border text-xs font-medium whitespace-nowrap ${toxicity.className}`}>
                      {toxicity.label}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1F1C] tracking-tight break-words [overflow-wrap:anywhere]">
                    {chemical.chemicalName}
                  </h1>
                  <p className="text-sm text-[#5A635D] mt-1 break-words [overflow-wrap:anywhere]">
                    สารออกฤทธิ์:{' '}
                    <span className="text-[#1A1F1C] font-semibold">{chemical.activeIngredient || '—'}</span>
                  </p>

                  <div className="mt-5 min-w-0">
                    <div className="text-sm font-semibold text-[#1A1F1C] mb-1">อัตราการใช้มาตรฐาน:</div>
                    <p className="text-sm text-[#3F4742] leading-relaxed break-words [overflow-wrap:anywhere]">
                      {chemical.dosageRate} {chemical.dosageUnit}
                    </p>
                  </div>

                  <div className="mt-4 min-w-0">
                    <div className="text-sm font-semibold text-[#1A1F1C] mb-1">คุณสมบัติการออกฤทธิ์:</div>
                    <p className="text-sm text-[#3F4742] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {chemical.property || '—'}
                    </p>
                  </div>
                </div>

                {/* คำอธิบาย */}
                <div className="mt-4 min-w-0">
                  <div className="text-sm font-semibold text-[#1A1F1C] mb-1">คำอธิบายและลักษณะการใช้:</div>
                  <p className="text-sm text-[#3F4742] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    {chemical.description || chemical.usageMethod || 'ไม่มีข้อมูลคำอธิบายเพิ่มเติม'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[#E3E6E4] flex items-center justify-between gap-3 text-xs text-[#5A635D]">
                <span>ข้อมูลตามทะเบียนสารป้องกันกำจัดศัตรูพืช</span>
                <Link
                  href="/member/calculation"
                  className="text-[#2D7048] hover:text-[#25593A] font-medium inline-flex items-center gap-1 shrink-0"
                >
                  <span>คำนวณปริมาณยาตามแปลงนา</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

          </div>

          {/* Warnings & Safety Notice */}
          <div className="bg-[#FFF4E0] border border-[#F0D29A] rounded-lg p-5 text-[#8A5300] min-w-0">
            <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
              <AlertTriangle size={18} className="text-[#8A5300] shrink-0" />
              <span>ข้อควรระวังและความปลอดภัย</span>
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere] mt-1">
              {chemical.warning || 'สวมอุปกรณ์ป้องกันอันตรายส่วนบุคคล (PPE) ทุกครั้งขณะผสมและพ่นสารเคมี และเว้นระยะเก็บเกี่ยวตามคำแนะนำบนฉลาก'}
            </p>

            <div className="mt-4 pt-3 border-t border-[#F0D29A] text-xs">
              ปฏิบัติตามคำเตือนบนฉลากผลิตภัณฑ์อย่างเคร่งครัด
            </div>
          </div>

        </div>

        {/* Image Modal */}
        {isImageModalOpen && chemical.chemicalImg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1F1C]/75 p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div className="relative w-full max-w-4xl aspect-square md:aspect-video rounded-lg overflow-hidden">
              <button
                className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
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
    </div>
  );
}

export default function ChemicalDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
          <span>กำลังโหลด...</span>
        </div>
      }
    >
      <ChemicalDetailContent />
    </Suspense>
  );
}