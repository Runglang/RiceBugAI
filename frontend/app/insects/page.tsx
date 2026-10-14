'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import GuestHeader from '../components/guest/GuestHeader';
import GuestFooter from '../components/guest/GuestFooter';

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
  high: { label: 'ระดับสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

const ALL_STAGES = 'ทุกระยะการเติบโต';
const ITEMS_PER_PAGE = 8;

export default function GuestInsectCatalog() {
  const [insects, setInsects] = useState<InsectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState(ALL_STAGES);
  const [page, setPage] = useState(1);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let ignore = false;
    const fetchInsects = async () => {
      try {
        const res = await fetch(API_BASE_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setInsects(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError('ไม่สามารถเชื่อมต่อกับระบบฐานข้อมูลได้ในขณะนี้');
          setLoading(false);
        }
      }
    };

    fetchInsects();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // รวบรวมระยะการเติบโตข้าวทั้งหมด
  const stageOptions = useMemo(() => {
    const stageSet = new Set<string>();
    insects.forEach((insect) => {
      insect.riceGrowthStages?.forEach((st) => {
        if (st.stageName) stageSet.add(st.stageName.trim());
      });
    });
    return [ALL_STAGES, ...Array.from(stageSet)];
  }, [insects]);

  // กรองข้อมูล
  const filteredInsects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return insects.filter((insect) => {
      const matchSearch =
        !q ||
        insect.insectName?.toLowerCase().includes(q) ||
        insect.scientificName?.toLowerCase().includes(q) ||
        insect.insectType?.toLowerCase().includes(q);

      const matchStage =
        selectedStage === ALL_STAGES ||
        insect.riceGrowthStages?.some(
          (st) => st.stageName?.trim() === selectedStage
        );

      return matchSearch && matchStage;
    });
  }, [insects, searchTerm, selectedStage]);

  // คำนวณ Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInsects.length / ITEMS_PER_PAGE));
  const currentInsects = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredInsects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInsects, page]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3F4742] font-sans">
      <GuestHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">

        {/* Header */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            สารานุกรมแมลงศัตรูข้าว
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            ฐานข้อมูลสัณฐานวิทยาชีวภาพ ลักษณะการทำลายผลผลิตข้าว และระดับความรุนแรง
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg p-4 mb-8 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA29D]" />
            <input
              type="text"
              placeholder="ค้นหาชื่อแมลง หรือชื่อวิทยาศาสตร์..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={15} className="text-[#5A635D] shrink-0" />
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048]"
            >
              {stageOptions.map((st) => (
                <option key={st} value={st}>
                  ระยะข้าว: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content State Handling */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
            <Loader2 className="animate-spin text-[#2D7048]" size={24} />
            <span>กำลังโหลดข้อมูลแมลง...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-6 text-sm text-[#B42318] flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="mt-2 px-4 py-2 bg-white border border-[#CDD2CF] text-[#1A1F1C] rounded-md text-sm font-medium hover:bg-[#F1F3F2] transition-colors cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : filteredInsects.length === 0 ? (
          <div className="py-16 text-center bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg p-8 text-sm text-[#5A635D]">
            ไม่พบข้อมูลแมลงที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div>
            {/* Insect Grid (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {currentInsects.map((insect) => {
                const danger = DANGER_BADGE[insect.dangerLevel?.toLowerCase()] || {
                  label: insect.dangerLevel || 'ทั่วไป',
                  className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
                };

                const firstImg = insect.insectImg && insect.insectImg.length > 0 ? insect.insectImg[0] : null;

                return (
                  <Link
                    key={insect.insectID}
                    href={`/insects/${insect.insectID}`}
                    className="group bg-white hover:border-[#CDD2CF] hover:shadow-xs border border-[#E3E6E4] rounded-lg p-4 flex flex-col justify-between transition-all duration-150"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[13px] font-medium text-[#5A635D]">
                          {insect.insectType || 'แมลงศัตรูข้าว'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-sm border text-xs font-medium ${danger.className}`}>
                          {danger.label}
                        </span>
                      </div>

                      {/* Image */}
                      <div className="w-full h-36 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] overflow-hidden mb-3 relative flex items-center justify-center">
                        {firstImg ? (
                          <Image
                            src={firstImg}
                            alt={insect.insectName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-[#9AA29D]">ไม่มีรูปภาพ</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-[15px] font-semibold text-[#1A1F1C] group-hover:text-[#2D7048] transition-colors leading-snug">
                        {insect.insectName}
                      </h3>
                      <p className="text-xs italic text-[#5A635D] mt-0.5 truncate">
                        {insect.scientificName || '—'}
                      </p>

                      {/* Description */}
                      <p className="text-xs text-[#3F4742] line-clamp-2 mt-2 leading-relaxed">
                        {insect.insectDes || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>
                    </div>

                    {/* Actions & Meta */}
                    <div className="mt-4 pt-3 border-t border-[#E3E6E4] flex items-center justify-between">
                      <span className="text-xs text-[#5A635D] truncate max-w-[120px]">
                        {insect.riceGrowthStages?.map((s) => s.stageName).join(', ') || 'ทุกระยะ'}
                      </span>

                      <div className="flex items-center gap-1 text-xs text-[#2D7048] font-medium group-hover:text-[#25593A] transition-colors shrink-0">
                        <span>ดูรายละเอียด</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#E3E6E4] text-sm text-[#5A635D]">
                <div>
                  แสดง {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredInsects.length)} จาก {filteredInsects.length} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-[#1A1F1C] px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <GuestFooter />
    </div>
  );
}