'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Bug,
  Eye,
} from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/insects`;

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

const DANGER_LABEL: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
};

const DANGER_STYLE: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

const CARD_COLORS = [
  '#3b4733',
  '#7a9e35',
  '#9c3f25',
  '#6e7a4b',
  '#523e25',
  '#6a8532',
  '#417a41',
  '#db785a',
];

const getCardColor = (id: string) => {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CARD_COLORS[sum % CARD_COLORS.length];
};

const ALL_STAGES = 'ทั้งหมด';
const ITEMS_PER_PAGE = 8;

export default function MemberListInsects() {
  const router = useRouter();

  const [insects, setInsects] = useState<InsectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState(ALL_STAGES);
  const [page, setPage] = useState(1);

  // =========================
  // Fetch insects (ฟังก์ชัน fetch ล้วนๆ)
  // =========================
  const doFetchInsects = useCallback(
    async (signal?: AbortSignal): Promise<InsectDTO[]> => {
      const res = await fetch(API_BASE_URL, { signal });
      if (!res.ok) {
        throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
      }
      return res.json();
    },
    []
  );

  // สำหรับปุ่ม "ลองใหม่อีกครั้ง"
  const fetchInsects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await doFetchInsects();
      setInsects(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
      );
    } finally {
      setLoading(false);
    }
  }, [doFetchInsects]);

  // Data fetching ตอน mount
  useEffect(() => {
    const controller = new AbortController();

    async function loadInsects() {
      try {
        const data = await doFetchInsects(controller.signal);
        if (!controller.signal.aborted) {
          setInsects(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadInsects();

    return () => {
      controller.abort();
    };
  }, [doFetchInsects]);

  // =========================
  // Stage filters
  // =========================
  const stageFilters = useMemo(() => {
    const stageNames = new Set<string>();
    insects.forEach((insect) => {
      insect.riceGrowthStages?.forEach((stage) => {
        stageNames.add(stage.stageName);
      });
    });
    return [ALL_STAGES, ...Array.from(stageNames).sort()];
  }, [insects]);

  // =========================
  // Search + Filter
  // =========================
  const filteredInsects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return insects.filter((insect) => {
      const matchesSearch =
        term === '' ||
        insect.insectName.toLowerCase().includes(term) ||
        insect.scientificName.toLowerCase().includes(term) ||
        insect.insectType.toLowerCase().includes(term);

      const matchesStage =
        selectedStage === ALL_STAGES ||
        insect.riceGrowthStages?.some(
          (stage) => stage.stageName === selectedStage
        );

      return matchesSearch && matchesStage;
    });
  }, [insects, searchTerm, selectedStage]);

  // =========================
  // Pagination
  // =========================
  const totalPages = Math.max(1, Math.ceil(filteredInsects.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);

  const pagedInsects = filteredInsects.slice(
    (currentPageSafe - 1) * ITEMS_PER_PAGE,
    currentPageSafe * ITEMS_PER_PAGE
  );

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(p, 1), totalPages));
  };

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPageSafe) <= 1)
      .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
        acc.push(p);
        return acc;
      }, []);
  }, [totalPages, currentPageSafe]);

  const rangeStart = filteredInsects.length === 0 ? 0 : (currentPageSafe - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPageSafe * ITEMS_PER_PAGE, filteredInsects.length);

  return (
    <div className="min-h-screen bg-[#f7f9fa] p-4 sm:p-8 md:p-12 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            สารานุกรมแมลงศัตรูพืชข้าว
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
            ค้นหาและศึกษาข้อมูลแมลงศัตรูพืชที่พบในนาข้าว
            เพื่อทำความเข้าใจลักษณะทางกายภาพ พฤติกรรม และวิธีรับมือ
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border border-slate-200 shadow-sm mb-8">

          {/* Search */}
          <div className="relative w-full lg:w-[45%]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาตามชื่อสามัญ ชื่อวิทยาศาสตร์ หรือชนิดของศัตรูพืช..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              กรองตามขั้นตอน:
            </span>
            <div className="flex gap-2">
              {stageFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setSelectedStage(filter);
                    setPage(1);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${
                    filter === selectedStage
                      ? 'bg-[#1e293b] text-white'
                      : 'bg-[#f1f5f9] text-slate-600 hover:bg-[#e2e8f0]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังโหลดข้อมูล...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center bg-white rounded-xl border border-slate-200">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchInsects}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredInsects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center bg-white rounded-xl border border-slate-200">
            <Bug className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              {insects.length === 0
                ? 'ยังไม่มีข้อมูลแมลงในระบบ'
                : 'ไม่พบแมลงที่ตรงกับคำค้นหาหรือตัวกรอง'}
            </p>
          </div>
        )}

        {/* Pest Grid */}
        {!loading && !error && pagedInsects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {pagedInsects.map((insect) => (
              <div
                key={insect.insectID}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full group hover:shadow-md transition-all duration-300"
              >
                {/* Image */}
                <div
                  className="h-44 w-full relative overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: getCardColor(insect.insectID) }}
                >
                  {insect.insectImg ? (
                    <Image
                      src={insect.insectImg}
                      alt={insect.insectName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <Bug className="w-8 h-8 text-white/60" />
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wide mb-1 uppercase">
                    {insect.scientificName}
                  </span>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-2">
                    {insect.insectName}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-6 flex-grow leading-relaxed">
                    {insect.insectDes}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      {insect.riceGrowthStages?.length
                        ? insect.riceGrowthStages.map((s) => s.stageName).join(', ')
                        : 'ไม่ระบุระยะ'}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded ${
                        DANGER_STYLE[insect.dangerLevel] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {DANGER_LABEL[insect.dangerLevel] ?? insect.dangerLevel}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => router.push(`/member/viewinsect?id=${insect.insectID}`)}
                    className="w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f8fafc] group-hover:bg-[#1e293b] group-hover:text-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 group-hover:border-transparent transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredInsects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <span className="text-sm font-semibold text-slate-500">
              แสดงผลลัพธ์ {rangeStart} ถึง {rangeEnd} จากทั้งหมด {filteredInsects.length} รายการ
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPageSafe - 1)}
                disabled={currentPageSafe === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, idx) =>
                p === 'ellipsis' ? (
                  <div key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm font-bold tracking-widest">
                    ...
                  </div>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={
                      p === currentPageSafe
                        ? 'w-8 h-8 flex items-center justify-center rounded border border-emerald-200 bg-[#dcfce7] text-[#166534] font-bold text-sm'
                        : 'w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-colors'
                    }
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPageSafe + 1)}
                disabled={currentPageSafe === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
