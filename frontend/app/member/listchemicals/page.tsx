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
  high: { label: 'ระดับสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

const ALL_TOXICITIES = 'ระดับความเป็นพิษทั้งหมด';
const ALL_USAGE_METHODS = 'วิธีการใช้งานทั้งหมด';

const USAGE_METHOD_LABELS: Record<string, string> = {
  foliar_spray: 'พ่นทางใบ',
  broadcast: 'หว่าน/โรยเม็ด',
};

const getUsageMethodLabel = (method: string) => {
  return USAGE_METHOD_LABELS[method.toLowerCase()] || method;
};

const ROWS_PER_PAGE = 8;

export default function MemberListChemicals() {
  const [chemicals, setChemicals] = useState<ChemicalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToxicity, setSelectedToxicity] = useState(ALL_TOXICITIES);
  const [selectedUsageMethod, setSelectedUsageMethod] = useState(ALL_USAGE_METHODS);
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

  const usageMethodOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [
      { value: ALL_USAGE_METHODS, label: ALL_USAGE_METHODS },
    ];

    chemicals.forEach((chem) => {
      const raw = chem.usageMethod?.trim();
      if (!raw) return;
      const label = getUsageMethodLabel(raw);
      if (!seen.has(label)) {
        seen.add(label);
        options.push({ value: raw, label });
      }
    });

    if (seen.size === 0) {
      options.push(
        { value: 'foliar_spray', label: 'พ่นทางใบ' },
        { value: 'broadcast', label: 'หว่าน/โรยเม็ด' }
      );
    }

    return options;
  }, [chemicals]);

  const filteredChemicals = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return chemicals.filter((chem) => {
      const matchSearch =
        !q ||
        chem.chemicalName?.toLowerCase().includes(q) ||
        chem.activeIngredient?.toLowerCase().includes(q) ||
        chem.property?.toLowerCase().includes(q) ||
        chem.usageMethod?.toLowerCase().includes(q) ||
        chem.targetInsects?.some((ins) => ins.insectName?.toLowerCase().includes(q));

      const chemTox = chem.toxicityLevel?.toLowerCase() || '';
      const matchToxicity =
        selectedToxicity === ALL_TOXICITIES ||
        chemTox === selectedToxicity.toLowerCase() ||
        (selectedToxicity === 'low' && chemTox.includes('ต่ำ')) ||
        (selectedToxicity === 'medium' && chemTox.includes('กลาง')) ||
        (selectedToxicity === 'high' && chemTox.includes('สูง'));

      const chemUsage = chem.usageMethod?.trim().toLowerCase() || '';
      const selectedUsage = selectedUsageMethod.trim().toLowerCase();
      const matchUsageMethod =
        selectedUsageMethod === ALL_USAGE_METHODS ||
        chemUsage === selectedUsage ||
        (selectedUsage === 'foliar_spray' && (chemUsage.includes('foliar') || chemUsage.includes('พ่น'))) ||
        (selectedUsage === 'broadcast' && (chemUsage.includes('broadcast') || chemUsage.includes('หว่าน') || chemUsage.includes('โรย'))) ||
        (selectedUsage.includes('พ่น') && (chemUsage.includes('foliar') || chemUsage.includes('พ่น'))) ||
        (selectedUsage.includes('หว่าน') && (chemUsage.includes('broadcast') || chemUsage.includes('หว่าน') || chemUsage.includes('โรย')));

      return matchSearch && matchToxicity && matchUsageMethod;
    });
  }, [chemicals, searchTerm, selectedToxicity, selectedUsageMethod]);

  const totalPages = Math.max(1, Math.ceil(filteredChemicals.length / ROWS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);
  const pagedChemicals = useMemo(() => {
    const start = (currentPageSafe - 1) * ROWS_PER_PAGE;
    return filteredChemicals.slice(start, start + ROWS_PER_PAGE);
  }, [filteredChemicals, currentPageSafe]);

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-8">

        {/* Header Strip */}
        <div className="pb-6 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            สารเคมีป้องกันกำจัดศัตรูข้าว
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            สารป้องกันกำจัดศัตรูพืช สารออกฤทธิ์ อัตราการผสมตามคำแนะนำ และการจัดการกลุ่มกลไกการออกฤทธิ์
          </p>
        </div>

        {/* Search & Filter Matrix */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA29D]" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสารเคมี, สารออกฤทธิ์, สรรพคุณ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal size={14} className="text-[#5A635D] shrink-0" />
              <select
                value={selectedToxicity}
                onChange={(e) => {
                  setSelectedToxicity(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
              >
                <option value={ALL_TOXICITIES}>{ALL_TOXICITIES}</option>
                <option value="low">ระดับต่ำ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">ระดับสูง</option>
              </select>
            </div>

            <select
              value={selectedUsageMethod}
              onChange={(e) => {
                setSelectedUsageMethod(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
            >
              {usageMethodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <span className="text-xs font-medium text-[#5A635D] whitespace-nowrap">
              ทั้งหมด {filteredChemicals.length} รายการ
            </span>
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
              className="mt-2 px-4 py-2 bg-white border border-[#CDD2CF] hover:bg-[#F1F3F2] text-[#1A1F1C] rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : filteredChemicals.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#E3E6E4] rounded-lg p-8 text-sm text-[#5A635D]">
            ไม่พบข้อมูลสารเคมีที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div className="bg-white border border-[#E3E6E4] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E3E6E4] bg-[#F7F8F7] text-xs font-semibold text-[#5A635D]">
                    <th className="py-3 px-4 w-20">ภาพ</th>
                    <th className="py-3 px-4">ชื่อสารเคมี</th>
                    <th className="py-3 px-4">สารออกฤทธิ์</th>
                    <th className="py-3 px-4">อัตราการใช้</th>
                    <th className="py-3 px-4">ระดับความเป็นพิษ</th>
                    <th className="py-3 px-4 text-right">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E6E4] bg-white text-[#3F4742]">
                  {pagedChemicals.map((chemical) => {
                    const tox = TOXICITY_BADGE[chemical.toxicityLevel?.toLowerCase()] || {
                      label: chemical.toxicityLevel || 'ทั่วไป',
                      className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
                    };

                    return (
                      <tr key={chemical.chemicalID} className="hover:bg-[#F7F8F7] transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-md border border-[#E3E6E4] overflow-hidden relative bg-[#F1F3F2] flex items-center justify-center">
                            {chemical.chemicalImg ? (
                              <Image
                                src={chemical.chemicalImg}
                                alt={chemical.chemicalName}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-[#9AA29D]">ไม่มีรูป</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1A1F1C]">{chemical.chemicalName}</div>
                        </td>

                        <td className="py-3 px-4 italic text-[#5A635D]">
                          {chemical.activeIngredient || '—'}
                        </td>

                        <td className="py-3 px-4 font-semibold text-[#1A1F1C] whitespace-nowrap">
                          {chemical.dosageRate} {chemical.dosageUnit}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-medium border whitespace-nowrap ${tox.className}`}>
                            {tox.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/member/viewchemical?id=${chemical.chemicalID}`}
                            className="inline-flex items-center h-8 px-3 rounded-md bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                          >
                            ดูรายละเอียด
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#F7F8F7] border-t border-[#E3E6E4] flex items-center justify-between">
                <span className="text-xs text-[#5A635D]">
                  แสดง {(currentPageSafe - 1) * ROWS_PER_PAGE + 1} - {Math.min(currentPageSafe * ROWS_PER_PAGE, filteredChemicals.length)} จาก {filteredChemicals.length} รายการ
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageSafe === 1}
                    className="p-1.5 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-xs font-medium text-[#1A1F1C] px-2">
                    {currentPageSafe} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageSafe === totalPages}
                    className="p-1.5 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
                  >
                    <ChevronRight size={15} />
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