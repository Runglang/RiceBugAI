'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronLeft,
  ExternalLink,
  ScanSearch,
  Info,
} from 'lucide-react';

interface RiceGrowthStage {
  stageID: string;
  stageName: string;
  stageDes: string;
  durationRange: string;
}

interface InsectDTO {
  insectID: string;
  insectName: string;
  insectImg?: string[] | null;
  scientificName?: string;
}

interface AuxiliaryResultDTO {
  stage: string;
  stageName: string;
  insectName: string;
  confidenceScore: number;
}

interface AnalysisResultDTO {
  analysisID: string;
  analysisDate: string;
  analysisImage: string;
  confidenceScore: number;
  recommendation?: string | null;
  insect: InsectDTO;
  riceGrowthStage: RiceGrowthStage;
  fieldID?: string | null;
  auxiliaryResults?: AuxiliaryResultDTO[] | null;
}

const emptySubscribe = () => () => {};

export default function AnalysisInsectResultPage() {
  const router = useRouter();

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const rawResult = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? sessionStorage.getItem('analysis_result') : null),
    () => null
  );

  const result = useMemo<AnalysisResultDTO | null>(() => {
    if (!rawResult) return null;
    try {
      return JSON.parse(rawResult);
    } catch {
      return null;
    }
  }, [rawResult]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
        <span>กำลังโหลดผลการวิเคราะห์ล่าสุด...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] font-sans py-16 px-4">
        <div className="max-w-md mx-auto p-8 bg-white border border-[#E3E6E4] rounded-lg text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F1F3F2] flex items-center justify-center text-[#5A635D]">
            <ScanSearch size={24} />
          </div>
          <h3 className="text-base font-bold text-[#1A1F1C]">ไม่พบข้อมูลผลการวิเคราะห์ล่าสุด</h3>
          <p className="text-sm text-[#5A635D]">
            กรุณาอัปโหลดภาพใบหรือต้นข้าวเพื่อทำการวินิจฉัยแมลงศัตรูพืชก่อน
          </p>
          <button
            onClick={() => router.push('/member/analysisinsect')}
            className="mt-2 inline-flex items-center gap-1.5 h-10 px-5 text-sm font-medium text-white bg-[#2D7048] rounded-md hover:bg-[#25593A] transition-colors cursor-pointer"
          >
            <ScanSearch size={16} />
            <span>ไปที่หน้าวิเคราะห์แมลง</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/member/analysisinsect"
            className="inline-flex items-center gap-1.5 text-xs text-[#5A635D] hover:text-[#1A1F1C] transition-colors"
          >
            <ChevronLeft size={14} />
            <span>กลับไปหน้าวิเคราะห์แมลง</span>
          </Link>
        </div>

        {/* Main Result Card */}
        <div className="bg-white border border-[#E3E6E4] rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#E3E6E4] gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F5EC] border border-[#B7DFC6] flex items-center justify-center text-[#2D7048]">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1F1C]">ผลการวิเคราะห์แมลงศัตรูข้าว</h1>
                <p className="text-xs text-[#5A635D]">
                  วิเคราะห์เมื่อ {formatDate(result.analysisDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Uploaded Image + AI Score */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative w-full aspect-4/3 bg-[#F1F3F2] rounded-lg border border-[#E3E6E4] overflow-hidden">
                {result.analysisImage ? (
                  <Image
                    src={result.analysisImage}
                    alt="Uploaded image"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#5A635D]">
                    ภาพที่ส่งวิเคราะห์
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-[#5A635D]">
                  <span>ความมั่นใจของโมเดล AI</span>
                  <span className="font-bold text-[#1A1F1C] text-sm tabular-nums">
                    {result.confidenceScore != null ? `${result.confidenceScore.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#E3E6E4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2D7048] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, result.confidenceScore || 0))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Insect Prediction & Details */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D7048] bg-[#E8F5EC] border border-[#B7DFC6] px-2.5 py-1 rounded-md mb-2">
                    <Sparkles size={13} />
                    <span>ตรวจพบแมลงศัตรูพืช</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1F1C]">
                    {result.insect.insectName}
                  </h2>
                  {result.insect.scientificName && (
                    <p className="text-sm italic text-[#5A635D] mt-0.5">
                      {result.insect.scientificName}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg">
                  <div className="text-xs text-[#5A635D] flex items-center gap-1.5 mb-1">
                    <Layers size={14} className="text-[#2D7048]" />
                    <span>ระยะการเจริญเติบโตของข้าว</span>
                  </div>
                  <div className="text-sm font-semibold text-[#1A1F1C]">
                    {result.riceGrowthStage?.stageName || 'ไม่ระบุ'}
                  </div>
                  {result.riceGrowthStage?.stageDes && (
                    <div className="text-xs text-[#5A635D] mt-0.5">
                      {result.riceGrowthStage.stageDes}
                    </div>
                  )}
                </div>

                {/* Reference Images from DB */}
                {result.insect.insectImg && result.insect.insectImg.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-[#1A1F1C] mb-2">
                      ภาพอ้างอิงจากฐานข้อมูล ({result.insect.insectImg.length} รูป):
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {result.insect.insectImg.map((imgUrl: string, idx: number) => (
                        <div
                          key={idx}
                          className="relative w-24 h-20 shrink-0 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] overflow-hidden"
                        >
                          <Image
                            src={imgUrl}
                            alt={`${result.insect.insectName} ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Auxiliary Results (other stage predictions) */}
              {result.auxiliaryResults && result.auxiliaryResults.length > 0 && (
                <div className="pt-4">
                  <div className="p-4 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg space-y-2.5">
                    <div className="text-xs font-semibold text-[#5A635D] flex items-center gap-1.5">
                      <Info size={13} className="text-[#5A635D]" />
                      <span>ผลการวิเคราะห์ประกอบจากระยะอื่น</span>
                    </div>
                    <div className="space-y-2">
                      {result.auxiliaryResults.map((aux: AuxiliaryResultDTO, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 bg-white border border-[#E3E6E4] rounded-md"
                        >
                          <span className="text-[#3F4742]">
                            ภาพนี้อาจใกล้เคียงกับ <strong className="text-[#1A1F1C]">{aux.insectName}</strong>{' '}
                            (ระยะ{aux.stageName})
                          </span>
                          <span className="text-[#5A635D] tabular-nums shrink-0 pl-3">
                            {aux.confidenceScore != null ? `${aux.confidenceScore.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 border-t border-[#E3E6E4] flex flex-wrap items-center gap-3">
                <Link
                  href={`/member/viewinsect?id=${result.insect.insectID}`}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium transition-colors"
                >
                  <span>ดูรายละเอียดแมลงและวิธีกำจัด</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href={`/member/calculation?insectID=${result.insect.insectID}`}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium transition-colors"
                >
                  <span>คำนวณสารเคมีสำหรับแมลงนี้</span>
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
