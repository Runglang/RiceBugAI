'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  ZoomIn,
  X,
  ArrowRight,
} from 'lucide-react';
import GuestHeader from '../../components/guest/GuestHeader';
import GuestFooter from '../../components/guest/GuestFooter';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/chemicals`;

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

const TOXICITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: 'ระดับความเป็นพิษสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ระดับความเป็นพิษปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับความเป็นพิษต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

export default function GuestChemicalDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [chemical, setChemical] = useState<ChemicalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const fetchChemical = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (res.status === 404) {
          if (!ignore) {
            setError('ไม่พบข้อมูลสารเคมีในระบบ');
            setLoading(false);
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setChemical(data);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError('ไม่สามารถโหลดข้อมูลรายละเอียดสารเคมีได้ในขณะนี้');
          setLoading(false);
        }
      }
    };

    fetchChemical();
    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3F4742] font-sans">
      <GuestHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">

        {/* State Handling */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
            <Loader2 className="animate-spin text-[#2D7048]" size={24} />
            <span>กำลังโหลดข้อมูลสารเคมี...</span>
          </div>
        ) : error || !chemical ? (
          <div className="py-14 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-6 text-sm text-[#B42318] flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error || 'ไม่พบข้อมูล'}</span>
            <Link
              href="/chemicals"
              className="mt-2 px-4 py-2 bg-white border border-[#CDD2CF] text-[#1A1F1C] rounded-md font-medium hover:bg-[#F1F3F2] transition-colors"
            >
              กลับหน้ารายการสารเคมี
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Main Overview Card */}
            <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 grid grid-cols-1 md:grid-cols-12 gap-8">

              {/* Left: Image Container */}
              <div className="md:col-span-5 space-y-3">
                <div
                  onClick={() => chemical.chemicalImg && setIsZoomOpen(true)}
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
              </div>

              {/* Right: Chemical Info */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#5A635D] font-medium">
                      {chemical.property || 'สารกำจัดแมลง'}
                    </span>
                    {(() => {
                      const toxicity = TOXICITY_BADGE[chemical.toxicityLevel?.toLowerCase()] || {
                        label: chemical.toxicityLevel || 'ทั่วไป',
                        className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
                      };
                      return (
                        <span className={`px-2.5 py-0.5 rounded-sm border text-xs font-medium ${toxicity.className}`}>
                          {toxicity.label}
                        </span>
                      );
                    })()}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1F1C] tracking-tight">
                    {chemical.chemicalName}
                  </h1>
                  <p className="text-sm text-[#5A635D] mt-1">
                    สารออกฤทธิ์: <span className="text-[#1A1F1C] font-medium">{chemical.activeIngredient || '—'}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-3 my-5 p-3.5 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
                    <div>
                      <div className="text-xs text-[#5A635D]">อัตราการใช้มาตรฐาน</div>
                      <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">
                        {chemical.dosageRate} {chemical.dosageUnit}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#5A635D]">คุณสมบัติการออกฤทธิ์</div>
                      <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">{chemical.property || '—'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[#1A1F1C] mb-1">คำอธิบายและลักษณะการใช้:</div>
                    <p className="text-sm text-[#3F4742] leading-relaxed whitespace-pre-line">
                      {chemical.description || chemical.usageMethod || 'ไม่มีข้อมูลคำอธิบายเพิ่มเติม'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[#E3E6E4] flex items-center justify-between text-xs text-[#5A635D]">
                  <span>ข้อมูลตามทะเบียนสารป้องกันกำจัดศัตรูพืช</span>
                  <Link
                    href="/member/calculation"
                    className="text-[#2D7048] hover:text-[#25593A] font-medium inline-flex items-center gap-1"
                  >
                    <span>คำนวณปริมาณยาตามแปลงนา</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

            </div>

            {/* Target Insects & Warnings Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Target Insects */}
              <div className="bg-[#F8FAF8] border border-[#E1E6E2] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-[#111813]">
                    แมลงเป้าหมายในการควบคุมกำจัด
                  </h3>
                  {chemical.targetInsects && chemical.targetInsects.length > 0 && (
                    <span className="text-xs text-[#156E3B] font-semibold bg-[#E8F6ED] border border-[#B2DEC3] px-2.5 py-0.5 rounded-full">
                      {chemical.targetInsects.length} ชนิด
                    </span>
                  )}
                </div>

                {!chemical.targetInsects || chemical.targetInsects.length === 0 ? (
                  <div className="text-xs sm:text-sm text-[#65716A] py-6 text-center bg-white rounded-lg border border-[#E1E6E2]">
                    ไม่มีการระบุแมลงเป้าหมายเฉพาะ
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          href={`/insects/${ins.insectID}`}
                          className="group relative h-28 sm:h-32 max-w-full rounded-lg overflow-hidden border border-[#E1E6E2] hover:border-[#2D7048] shadow-2xs hover:shadow-md transition-all flex flex-col justify-end p-3 bg-[#2D3730] shrink-0"
                        >
                          {/* Background Photo */}
                          {insectPhoto ? (
                            <Image
                              src={insectPhoto}
                              alt={ins.insectName}
                              fill
                              sizes="(max-width: 640px) 100vw, 50vw"
                              className="object-cover object-center max-w-full max-h-full transition-transform duration-500 group-hover:scale-105"
                              unoptimized
                            />
                          ) : null}

                          {/* Dark Gradient Overlay for readability */}
                          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/10 group-hover:from-black/95 group-hover:via-black/55 transition-colors pointer-events-none" />

                          {/* Bottom Info */}
                          <div className="relative z-10 space-y-0.5 max-w-full">
                            <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#A7F3D0] transition-colors leading-snug truncate drop-shadow-sm">
                              {ins.insectName}
                            </div>
                            <div className="text-[11px] text-white/80 italic truncate font-normal">
                              {ins.scientificName || '—'}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Warnings & Safety Notice */}
              <div className="bg-[#FFF4E0] border border-[#F0D29A] rounded-lg p-5 flex flex-col justify-between text-[#8A5300]">
                <div>
                  <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
                    <AlertTriangle size={18} className="text-[#8A5300] shrink-0" />
                    <span>ข้อควรระวังและความปลอดภัย</span>
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-line mt-1">
                    {chemical.warning || 'สวมอุปกรณ์ป้องกันอันตรายส่วนบุคคล (PPE) ทุกครั้งขณะผสมและพ่นสารเคมี และเว้นระยะเก็บเกี่ยวตามคำแนะนำบนฉลาก'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0D29A] text-xs">
                  ปฏิบัติตามคำเตือนบนฉลากผลิตภัณฑ์อย่างเคร่งครัด
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Zoom Modal */}
      {isZoomOpen && chemical?.chemicalImg && (
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
                src={chemical.chemicalImg}
                alt={chemical.chemicalName}
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