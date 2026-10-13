'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_ORIGIN}/api/v1/chemicals`;

interface InsectRefDTO {
  insectID: string;
  insectName: string;
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
  high: { label: 'อันตรายสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'อันตรายต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

const ALL_TOXICITIES = 'ระดับความเป็นพิษทั้งหมด';
const ITEMS_PER_PAGE = 8;

export default function MemberListChemicals() {
  const [chemicals, setChemicals] = useState<ChemicalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToxicity, setSelectedToxicity] = useState(ALL_TOXICITIES);
  const [page, setPage] = useState(1);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let ignore = false;
    const fetchChemicals = async () => {
      try {
        const res = await fetch(API_BASE_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) {
          setChemicals(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError('ไม่สามารถเชื่อมต่อกับระบบฐานข้อมูลคลังสารเคมีได้ในขณะนี้');
          setLoading(false);
        }
      }
    };

    fetchChemicals();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const filteredChemicals = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return chemicals.filter((chem) => {
      const matchSearch =
        !q ||
        chem.chemicalName?.toLowerCase().includes(q) ||
        chem.activeIngredient?.toLowerCase().includes(q) ||
        chem.property?.toLowerCase().includes(q) ||
        chem.targetInsects?.some((ins) => ins.insectName?.toLowerCase().includes(q));

      const matchToxicity =
        selectedToxicity === ALL_TOXICITIES ||
        chem.toxicityLevel?.toLowerCase() === selectedToxicity.toLowerCase();

      return matchSearch && matchToxicity;
    });
  }, [chemicals, searchTerm, selectedToxicity]);

  const totalPages = Math.max(1, Math.ceil(filteredChemicals.length / ITEMS_PER_PAGE));
  const currentChemicals = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredChemicals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredChemicals, page]);

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-8">

        {/* Header Strip */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            คลังสารเคมีเกษตรและอัตราการใช้
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            สารป้องกันกำจัดศัตรูพืช สารออกฤทธิ์ อัตราการผสมตามคำแนะนำ และการจัดการกลุ่มกลไกการออกฤทธิ์
          </p>
        </div>

        {/* Search & Filter Matrix */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-4 mb-8 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA29D]" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสารเคมี, สารออกฤทธิ์ หรือแมลงเป้าหมาย..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal size={14} className="text-[#5A635D] shrink-0" />
            <select
              value={selectedToxicity}
              onChange={(e) => {
                setSelectedToxicity(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
            >
              <option value={ALL_TOXICITIES}>{ALL_TOXICITIES}</option>
              <option value="low">ความเป็นพิษต่ำ</option>
              <option value="medium">ความเป็นพิษปานกลาง</option>
              <option value="high">ความเป็นพิษสูง</option>
            </select>
          </div>
        </div>

        {/* Content State Handling */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
            <Loader2 className="animate-spin text-[#2D7048]" size={24} />
            <span>กำลังโหลดฐานข้อมูลคลังสารเคมี...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-6 text-sm text-[#B42318] flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="mt-2 px-3 py-1.5 bg-white border border-[#CDD2CF] text-[#1A1F1C] rounded-md text-sm font-medium hover:bg-[#F1F3F2] transition-colors cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : filteredChemicals.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#E3E6E4] rounded-lg p-8 text-sm text-[#5A635D]">
            ไม่พบข้อมูลสารเคมีที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div>
            {/* Chemical Grid (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {currentChemicals.map((chem) => {
                const toxicity = TOXICITY_BADGE[chem.toxicityLevel?.toLowerCase()] || {
                  label: chem.toxicityLevel || 'ทั่วไป',
                  className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
                };

                return (
                  <Link
                    key={chem.chemicalID}
                    href={`/member/viewchemical?id=${chem.chemicalID}`}
                    className="group bg-white hover:border-[#CDD2CF] hover:shadow-xs border border-[#E3E6E4] rounded-lg p-4 flex flex-col justify-between transition-all duration-150"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[13px] text-[#5A635D] font-medium">
                          {chem.property || 'สารกำจัดแมลง'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-sm border text-xs font-medium ${toxicity.className}`}>
                          {toxicity.label}
                        </span>
                      </div>

                      {/* Image Container */}
                      <div className="w-full h-36 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] overflow-hidden mb-3 relative flex items-center justify-center">
                        {chem.chemicalImg ? (
                          <Image
                            src={chem.chemicalImg}
                            alt={chem.chemicalName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-[#9AA29D]">ไม่มีรูปภาพ</span>
                        )}
                      </div>

                      {/* Name & Active Ingredient */}
                      <h3 className="text-[15px] font-semibold text-[#1A1F1C] group-hover:text-[#2D7048] transition-colors leading-snug">
                        {chem.chemicalName}
                      </h3>
                      <p className="text-xs text-[#5A635D] mt-0.5 truncate">
                        {chem.activeIngredient || '—'}
                      </p>

                      <div className="mt-2.5 pt-2.5 border-t border-[#E3E6E4] text-xs text-[#5A635D] space-y-1">
                        <div>
                          <span className="text-[#9AA29D]">อัตราการใช้: </span>
                          <span className="font-semibold text-[#1A1F1C]">
                            {chem.dosageRate} {chem.dosageUnit}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-[#9AA29D]">กำจัด: </span>
                          <span>
                            {chem.targetInsects?.map((i) => i.insectName).join(', ') || 'ตามคำแนะนำ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[#E3E6E4] flex items-center justify-between text-xs text-[#2D7048] font-medium">
                      <span>ดูสูตรและวิธีใช้</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#E3E6E4] text-sm text-[#5A635D]">
                <div>
                  แสดง {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredChemicals.length)} จาก {filteredChemicals.length} รายการ
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

      </div>
    </div>
  );
}
