'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
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
  const router = useRouter();
  const id = params?.id as string;

  const [chemical, setChemical] = useState<ChemicalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const fetchChemical = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`);
      if (res.status === 404) {
        setError('ไม่พบข้อมูลสารเคมีในระบบ');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChemical(data);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลรายละเอียดสารเคมีได้ในขณะนี้');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChemical();
  }, [fetchChemical]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3F4742] font-sans">
      <GuestHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E3E6E4]">
          <div className="flex items-center gap-2 text-sm text-[#5A635D]">
            <Link href="/" className="hover:text-[#1A1F1C] hover:underline">หน้าแรก</Link>
            <span>/</span>
            <Link href="/chemicals" className="hover:text-[#1A1F1C] hover:underline">สารเคมี</Link>
            <span>/</span>
            <span className="text-[#1A1F1C] font-semibold">{chemical?.chemicalName || 'รายละเอียด'}</span>
          </div>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-[#5A635D] hover:text-[#1A1F1C] font-medium cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>ย้อนกลับ</span>
          </button>
        </div>

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
              <div className="bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#1A1F1C] mb-3">
                  แมลงเป้าหมายในการควบคุมกำจัด
                </h3>

                {!chemical.targetInsects || chemical.targetInsects.length === 0 ? (
                  <div className="text-sm text-[#5A635D]">
                    ไม่มีการระบุแมลงเป้าหมายเฉพาะ
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chemical.targetInsects.map((ins) => (
                      <Link
                        key={ins.insectID}
                        href={`/insects/${ins.insectID}`}
                        className="flex items-center justify-between p-3 bg-white hover:bg-[#F1F3F2] border border-[#E3E6E4] rounded-md transition-colors group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#1A1F1C] group-hover:text-[#2D7048]">
                            {ins.insectName}
                          </div>
                          <div className="text-xs italic text-[#5A635D]">
                            {ins.scientificName || '—'}
                          </div>
                        </div>
                        <span className="text-xs text-[#5A635D] group-hover:text-[#1A1F1C] flex items-center gap-1">
                          <span>ดูข้อมูล</span>
                          <ArrowRight size={12} />
                        </span>
                      </Link>
                    ))}
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