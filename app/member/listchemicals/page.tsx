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
  FlaskConical,
  Eye,
  SlidersHorizontal,
  ListFilter,
} from 'lucide-react';

// ตั้งค่าใน .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/chemicals`;

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.InsectDTO (แบบย่อ สำหรับ targetInsects)
interface InsectRefDTO {
  insectID: string;
  insectName: string;
}

// ตรงกับ com.ricebugai.aiinsectapi.v1.dtos.ChemicalDTO
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

const TOXICITY_LABEL: Record<string, string> = {
  low: 'ต่ำ',
  medium: 'กลาง',
  high: 'สูง',
};

const TOXICITY_STYLE: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
};

const ROWS_PER_PAGE = 10;
const ALL_TOXICITIES = 'ระดับความเป็นพิษทั้งหมด';

export default function ChemicalListPage() {
  const router = useRouter();

  const [chemicals, setChemicals] = useState<ChemicalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToxicity, setSelectedToxicity] = useState(ALL_TOXICITIES);
  const [sortOrder, setSortOrder] = useState<'A-Z' | 'Z-A'>('A-Z');
  const [isToxicityDropdownOpen, setIsToxicityDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);

  // =========================
  // Fetch chemicals
  // =========================
  const doFetchChemicals = useCallback(async (signal?: AbortSignal): Promise<ChemicalDTO[]> => {
    const res = await fetch(API_BASE_URL, { signal });
    if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    return res.json();
  }, []);

  const fetchChemicals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await doFetchChemicals();
      setChemicals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  }, [doFetchChemicals]);

  // Data fetching ตอน mount
  useEffect(() => {
    const controller = new AbortController();

    async function loadChemicals() {
      try {
        const data = await doFetchChemicals(controller.signal);
        if (!controller.signal.aborted) {
          setChemicals(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadChemicals();

    return () => {
      controller.abort();
    };
  }, [doFetchChemicals]);

  // =========================
  // Click Outside Handler สำหรับ Dropdowns
  // =========================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.toxicity-dropdown')) setIsToxicityDropdownOpen(false);
      if (!target.closest('.sort-dropdown')) setIsSortDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toxicityFilters = [ALL_TOXICITIES, 'low', 'medium', 'high'];

  // =========================
  // Search + Filter + Sort
  // =========================
  const filteredChemicals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const result = chemicals.filter((chemical) => {
      const matchesSearch =
        term === '' ||
        chemical.chemicalName.toLowerCase().includes(term) ||
        chemical.activeIngredient.toLowerCase().includes(term) ||
        (TOXICITY_LABEL[chemical.toxicityLevel] || chemical.toxicityLevel).toLowerCase().includes(term);

      const matchesToxicity =
        selectedToxicity === ALL_TOXICITIES || chemical.toxicityLevel === selectedToxicity;

      return matchesSearch && matchesToxicity;
    });

    // เรียงลำดับ A-Z หรือ Z-A ตามชื่อสารเคมี
    result.sort((a, b) => {
      const nameA = a.chemicalName.toLowerCase();
      const nameB = b.chemicalName.toLowerCase();
      if (sortOrder === 'A-Z') {
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      } else {
        return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
      }
    });

    return result;
  }, [chemicals, searchTerm, selectedToxicity, sortOrder]);

  // =========================
  // Pagination
  // =========================
  const totalPages = Math.max(1, Math.ceil(filteredChemicals.length / ROWS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);

  const pagedChemicals = filteredChemicals.slice(
    (currentPageSafe - 1) * ROWS_PER_PAGE,
    currentPageSafe * ROWS_PER_PAGE
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

  const rangeStart = filteredChemicals.length === 0 ? 0 : (currentPageSafe - 1) * ROWS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPageSafe * ROWS_PER_PAGE, filteredChemicals.length);

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-6 sm:p-10 font-sans text-gray-800 flex justify-center">
      <div className="max-w-6xl w-full">

        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <nav className="flex items-center text-sm font-semibold text-gray-500 mb-6 gap-2">
            <span
              onClick={() => router.push('/')}
              className="hover:text-gray-800 cursor-pointer transition-colors"
            >
              หน้าแรก
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">สารเคมี</span>
          </nav>

          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            รายการเคมีกำจัดแมลง
          </h1>
          <p className="text-sm text-gray-500 max-w-3xl leading-relaxed font-medium">
            บริหารจัดการและทบทวนการใช้สารเคมีทางการเกษตรที่เหมาะสมสำหรับนาข้าว
            ติดตามส่วนประกอบสำคัญ และตรวจสอบระดับความเป็นพิษ
          </p>
        </div>

        {/* Action Bar: Search & Filters */}
        <div className="bg-white rounded-xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center border border-gray-200 mb-6">

          {/* Search */}
          <div className="relative w-full lg:w-1/3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -trangray-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อสารเคมี, ส่วนประกอบ..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 w-full lg:w-auto mt-4 lg:mt-0">

            {/* Dropdown ระดับความเป็นพิษ */}
            <div className="relative toxicity-dropdown flex-1 lg:flex-none">
              <button
                onClick={() => setIsToxicityDropdownOpen(!isToxicityDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {selectedToxicity === ALL_TOXICITIES ? 'ระดับความเป็นพิษทั้งหมด' : TOXICITY_LABEL[selectedToxicity] || selectedToxicity}
                  </span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isToxicityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {isToxicityDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full lg:w-48 bg-white border border-gray-200 rounded-lg z-10 overflow-hidden">
                  {toxicityFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setSelectedToxicity(filter);
                        setIsToxicityDropdownOpen(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                        selectedToxicity === filter
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {filter === ALL_TOXICITIES ? 'ระดับความเป็นพิษทั้งหมด' : TOXICITY_LABEL[filter] || filter}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown เรียงลำดับ */}
            <div className="relative sort-dropdown flex-1 lg:flex-none">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-gray-500" />
                  <span>เรียง: {sortOrder}</span>
                </div>
              </button>

              {isSortDropdownOpen && (
                <div className="absolute top-full right-0 lg:left-0 mt-1 w-full lg:w-36 bg-white border border-gray-200 rounded-lg z-10 overflow-hidden">
                  {['A-Z', 'Z-A'].map((order) => (
                    <button
                      key={order}
                      onClick={() => {
                        setSortOrder(order as 'A-Z' | 'Z-A');
                        setIsSortDropdownOpen(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                        sortOrder === order
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ชื่อ {order}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังโหลดข้อมูล...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchChemicals}
                className="px-4 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredChemicals.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <FlaskConical className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                {chemicals.length === 0
                  ? 'ยังไม่มีข้อมูลสารเคมีในระบบ'
                  : 'ไม่พบสารเคมีที่ตรงกับคำค้นหาหรือตัวกรอง'}
              </p>
            </div>
          )}

          {/* Data table */}
          {!loading && !error && filteredChemicals.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  {/* Table Head */}
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 w-1/4">ชื่อสารเคมี</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 w-1/4">ส่วนประกอบสำคัญ</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 w-32">ความเป็นพิษ</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400">อัตราปริมาณ</th>
                      <th className="py-4 px-6 text-[11px] font-bold text-gray-400 text-center"></th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-100">
                    {pagedChemicals.map((chemical) => (
                      <tr key={chemical.chemicalID} className="hover:bg-gray-50/50 transition-colors group">

                        {/* ชื่อสารเคมี + รูปภาพ */}
                        <td className="py-4 px-6 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden relative bg-gray-100 shrink-0">
                            {chemical.chemicalImg ? (
                              <Image
                                src={chemical.chemicalImg}
                                alt={chemical.chemicalName}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <FlaskConical className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-gray-800 text-sm">
                            {chemical.chemicalName}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-gray-500 italic font-serif text-sm">
                          {chemical.activeIngredient}
                        </td>

                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              TOXICITY_STYLE[chemical.toxicityLevel] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {TOXICITY_LABEL[chemical.toxicityLevel] ?? chemical.toxicityLevel}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-gray-600 font-medium text-sm">
                          {chemical.dosageRate} {chemical.dosageUnit}
                        </td>

                        {/* Action Button */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => router.push(`/member/viewchemical?id=${chemical.chemicalID}`)}
                            className="p-1.5 inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 font-semibold text-xs rounded-md transition-all border border-transparent hover:border-gray-200"
                            title="ดูรายละเอียดเพิ่มเติม"
                          >
                            <Eye className="w-4 h-4" />
                            <span>ดูข้อมูล</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <span className="text-sm font-semibold text-gray-500">
                  แสดงผลลัพธ์ {rangeStart} ถึง {rangeEnd} จากทั้งหมด {filteredChemicals.length} รายการ
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => goToPage(currentPageSafe - 1)}
                    disabled={currentPageSafe === 1}
                    className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {pageNumbers.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <div key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm font-bold tracking-widest">
                        ...
                      </div>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={
                          p === currentPageSafe
                            ? 'w-8 h-8 flex items-center justify-center rounded border border-gray-800 bg-gray-800 text-white font-bold text-sm'
                            : 'w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 font-bold text-sm bg-white hover:bg-gray-50 transition-colors'
                        }
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(currentPageSafe + 1)}
                    disabled={currentPageSafe === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
