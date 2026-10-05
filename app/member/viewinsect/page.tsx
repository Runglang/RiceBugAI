'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ZoomIn,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/insects`;

const DANGER_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: 'ระดับอันตรายสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ระดับอันตรายปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับอันตรายต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

interface RiceGrowthStageDTO {
  stageID: string;
  stageName: string;
  stageDes: string;
  durationRange: string;
}

interface InsectDTO {
  insectID: string;
  insectName: string;
  scientificName: string;
  insectType: string;
  dangerLevel: string;
  insectDes: string;
  insectImg?: string[] | null;
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

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  if (pageState === 'loading') {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
        <span>กำลังโหลดข้อมูลแมลงศัตรูพืช...</span>
      </div>
    );
  }

  if (pageState === 'notFound') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-center space-y-3 font-sans">
        <AlertCircle className="w-8 h-8 text-[#B42318] mx-auto" />
        <p className="text-sm font-semibold text-[#B42318]">ไม่พบข้อมูลแมลงนี้ในระบบ (อาจถูกลบไปแล้ว)</p>
        <button
          onClick={() => router.push('/member/listinsects')}
          className="px-4 py-2 text-sm bg-white border border-[#CDD2CF] text-[#1A1F1C] font-medium rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
        >
          กลับไปหน้ารายการแมลง
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

  if (!insect) return null;

  const images: string[] = insect.insectImg ?? [];
  const danger = DANGER_BADGE[insect.dangerLevel?.toLowerCase()] || {
    label: insect.dangerLevel || 'ทั่วไป',
    className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-5xl mx-auto px-6 pt-8">

        {/* Breadcrumbs */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E3E6E4]">
          <div className="flex items-center gap-2 text-sm text-[#5A635D]">
            <Link href="/member/dashboard" className="hover:text-[#1A1F1C] transition-colors">แดชบอร์ด</Link>
            <span>/</span>
            <Link href="/member/listinsects" className="hover:text-[#1A1F1C] transition-colors">ข้อมูลแมลง</Link>
            <span>/</span>
            <span className="text-[#1A1F1C] font-semibold">{insect.insectName}</span>
          </div>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-[#5A635D] hover:text-[#1A1F1C] transition-colors font-medium cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>ย้อนกลับ</span>
          </button>
        </div>

        <div className="space-y-8">

          {/* Specimen Header Card */}
          <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Left: Gallery */}
            <div className="md:col-span-5 space-y-3">
              <div
                onClick={() => images.length > 0 && setIsImageModalOpen(true)}
                className={`w-full h-64 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] relative overflow-hidden flex items-center justify-center ${
                  images.length > 0 ? 'cursor-zoom-in group' : ''
                }`}
              >
                {images.length > 0 ? (
                  <>
                    <Image
                      src={images[selectedImageIndex]}
                      alt={insect.insectName}
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

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-md border overflow-hidden relative shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-[#2D7048] ring-2 ring-[#B9DBC6]'
                          : 'border-[#E3E6E4] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Taxonomic Summary */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#5A635D] font-medium">
                    {insect.insectType || 'ศัตรูพืชในนาข้าว'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-sm border text-xs font-medium ${danger.className}`}>
                    {danger.label}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1F1C] tracking-tight">
                  {insect.insectName}
                </h1>
                <p className="text-sm italic text-[#5A635D] mt-1">
                  {insect.scientificName || '—'}
                </p>

                <div className="grid grid-cols-2 gap-3 my-5 p-3.5 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
                  <div>
                    <div className="text-xs text-[#5A635D]">ประเภทแมลง</div>
                    <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">{insect.insectType || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5A635D]">การจัดหมวดหมู่</div>
                    <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">ศัตรูพืชในนาข้าว</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-[#1A1F1C] mb-1.5">ลักษณะและพฤติกรรมการทำลาย:</div>
                  <p className="text-sm text-[#3F4742] leading-relaxed whitespace-pre-line">
                    {insect.insectDes || 'ไม่มีข้อมูลคำอธิบายเพิ่มเติม'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[#E3E6E4] flex items-center justify-between text-xs text-[#5A635D]">
                <span>ข้อมูลชีววิทยาอ้างอิงตามมาตรฐานวิชาการ</span>
                <Link
                  href="/member/listchemicals"
                  className="text-[#2D7048] hover:text-[#25593A] font-medium inline-flex items-center gap-1"
                >
                  <span>ดูสารเคมีที่แนะนำสำหรับกำจัด</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

          </div>

          {/* Rice Growth Stages Affected Section */}
          <div className="bg-white border border-[#E3E6E4] rounded-lg p-6">
            <h2 className="text-base font-bold text-[#1A1F1C] mb-4">
              ระยะการเจริญเติบโตของข้าวที่ถูกเข้าทำลาย
            </h2>

            {!insect.riceGrowthStages || insect.riceGrowthStages.length === 0 ? (
              <div className="text-sm text-[#5A635D]">
                ไม่มีการระบุระยะการเจริญเติบโตที่เฉพาะเจาะจง (สามารถเข้าทำลายได้ทุกระยะ)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {insect.riceGrowthStages.map((st) => (
                  <div
                    key={st.stageID || st.stageName}
                    className="p-3.5 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md"
                  >
                    <div className="flex items-center justify-between text-sm font-bold text-[#1A1F1C] mb-1">
                      <span>{st.stageName}</span>
                      {st.durationRange && (
                        <span className="text-xs bg-white px-2 py-0.5 rounded text-[#5A635D] font-medium border border-[#E3E6E4]">
                          {st.durationRange}
                        </span>
                      )}
                    </div>
                    {st.stageDes && (
                      <p className="text-xs text-[#5A635D] leading-relaxed mt-1">
                        {st.stageDes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Image Modal */}
        {isImageModalOpen && images.length > 0 && (
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
                src={images[selectedImageIndex]}
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
    </div>
  );
}

export default function ViewInsectPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
          <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
          <span>กำลังโหลด...</span>
        </div>
      }
    >
      <ViewInsectContent />
    </Suspense>
  );
}
