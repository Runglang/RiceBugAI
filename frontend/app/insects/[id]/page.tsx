'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2,
  AlertCircle,
  ZoomIn,
  X,
  ArrowRight,
} from 'lucide-react';
import GuestHeader from '../../components/guest/GuestHeader';
import GuestFooter from '../../components/guest/GuestFooter';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/insects`;

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

const DANGER_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: 'ระดับอันตรายสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ระดับอันตรายปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับอันตรายต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

export default function GuestInsectDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [insect, setInsect] = useState<InsectDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const fetchInsect = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (res.status === 404) {
          if (!ignore) {
            setError('ไม่พบข้อมูลแมลงศัตรูพืชในระบบ');
            setLoading(false);
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setInsect(data);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError('ไม่สามารถโหลดข้อมูลรายละเอียดแมลงได้ในขณะนี้');
          setLoading(false);
        }
      }
    };

    fetchInsect();
    return () => {
      ignore = true;
    };
  }, [id]);

  const images = insect?.insectImg && insect.insectImg.length > 0 ? insect.insectImg : [];
  const currentImg = images[activeImgIndex] || null;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3F4742] font-sans">
      <GuestHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">

        {/* State Handling */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
            <Loader2 className="animate-spin text-[#2D7048]" size={24} />
            <span>กำลังโหลดข้อมูลแมลง...</span>
          </div>
        ) : error || !insect ? (
          <div className="py-14 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-6 text-sm text-[#B42318] flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error || 'ไม่พบข้อมูล'}</span>
            <Link
              href="/insects"
              className="mt-2 px-4 py-2 bg-white border border-[#CDD2CF] text-[#1A1F1C] rounded-md font-medium hover:bg-[#F1F3F2] transition-colors"
            >
              กลับหน้ารายการแมลง
            </Link>
          </div>
        ) : (
          /* Specimen Details Card */
          <div className="bg-white border border-[#E1E6E2] rounded-xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

              {/* Left: Specimen Gallery */}
              <div className="md:col-span-5 space-y-3">
                <div
                  onClick={() => currentImg && setIsZoomOpen(true)}
                  className={`w-full h-64 bg-[#F8FAF8] rounded-lg border border-[#E1E6E2] relative overflow-hidden flex items-center justify-center ${
                    currentImg ? 'cursor-zoom-in group' : ''
                  }`}
                >
                  {currentImg ? (
                    <>
                      <Image
                        src={currentImg}
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
                    <span className="text-xs text-[#939E97]">ไม่มีรูปภาพ</span>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImgIndex(idx)}
                        className={`w-14 h-14 rounded-lg border overflow-hidden relative shrink-0 transition-all cursor-pointer ${
                          activeImgIndex === idx
                            ? 'border-[#2D7048] ring-2 ring-[#B2DEC3]'
                            : 'border-[#E1E6E2] opacity-70 hover:opacity-100'
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
                    <span className="text-xs sm:text-sm text-[#65716A] font-medium">
                      {insect.insectType || 'ศัตรูพืชในนาข้าว'}
                    </span>
                    {(() => {
                      const danger = DANGER_BADGE[insect.dangerLevel?.toLowerCase()] || {
                        label: insect.dangerLevel || 'ทั่วไป',
                        className: 'bg-[#F1F4F2] text-[#2D3730] border-[#E1E6E2]',
                      };
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${danger.className}`}>
                          {danger.label}
                        </span>
                      );
                    })()}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-[#111813] tracking-tight">
                    {insect.insectName}
                  </h1>
                  <p className="text-sm italic text-[#65716A] mt-1">
                    {insect.scientificName || '—'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-[#F8FAF8] border border-[#E1E6E2] rounded-lg">
                    <div>
                      <div className="text-xs text-[#65716A]">ประเภทแมลง</div>
                      <div className="text-sm font-semibold text-[#111813] mt-0.5">{insect.insectType || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#65716A]">การจัดหมวดหมู่</div>
                      <div className="text-sm font-semibold text-[#111813] mt-0.5">ศัตรูพืชในนาข้าว</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-semibold text-[#111813] mb-1.5">ระยะข้าวที่ถูกเข้าทำลาย:</div>
                    {insect.riceGrowthStages && insect.riceGrowthStages.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {insect.riceGrowthStages.map((st) => (
                          <span
                            key={st.stageID || st.stageName}
                            className="inline-flex items-center text-xs font-semibold bg-[#E8F6ED] text-[#156E3B] border border-[#B2DEC3] px-2.5 py-1 rounded-md"
                          >
                            {st.stageName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm text-[#65716A]">ไม่ระบุระยะ</span>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[#111813] mb-1.5">ลักษณะและพฤติกรรมการทำลาย:</div>
                    <p className="text-xs sm:text-sm text-[#4B5750] leading-relaxed whitespace-pre-line">
                      {insect.insectDes || 'ไม่มีข้อมูลคำอธิบายเพิ่มเติม'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[#E1E6E2] flex items-center justify-between text-xs text-[#65716A]">
                  <span>ข้อมูลชีววิทยาอ้างอิงตามมาตรฐานวิชาการ</span>
                  <Link
                    href="/chemicals"
                    className="text-[#2D7048] hover:text-[#25593A] font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <span>ดูสารเคมีที่แนะนำ</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

            </div>
        )}

      </main>

      {/* Image Zoom Modal */}
      {isZoomOpen && currentImg && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1F1C]/75 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-2 right-2 z-10 p-2 text-white/80 hover:text-white bg-black/40 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={currentImg}
                alt={insect?.insectName || ''}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      <GuestFooter />
    </div>
  );
}