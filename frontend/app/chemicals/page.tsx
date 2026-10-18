'use client';

import { useEffect, useState, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 8;

export default function GuestChemicalCatalog() {
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
          setError('ไม่สามารถเชื่อมต่อกับระบบคลังสารเคมีได้ในขณะนี้');
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
    const term = searchTerm.trim().toLowerCase();
    return chemicals.filter((chem) => {
      const matchSearch =
        !term ||
        chem.chemicalName?.toLowerCase().includes(term) ||
        chem.activeIngredient?.toLowerCase().includes(term) ||
        chem.property?.toLowerCase().includes(term) ||
        chem.usageMethod?.toLowerCase().includes(term) ||
        chem.targetInsects?.some((ins) => ins.insectName?.toLowerCase().includes(term));

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

  const totalPages = Math.max(1, Math.ceil(filteredChemicals.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);
  const pagedChemicals = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredChemicals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredChemicals, currentPageSafe]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3F4742] font-sans">
      <GuestHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">

        {/* Header */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            สารเคมีป้องกันกำจัดแมลงศัตรูข้าว
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            ฐานข้อมูลสารป้องกันกำจัดแมลง สารออกฤทธิ์ อัตราการใช้มาตรฐาน และคำแนะนำความปลอดภัย
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg p-4 mb-8 flex flex-col md:flex-row gap-3 items-center justify-between">
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
              <Filter size={15} className="text-[#5A635D] shrink-0" />
              <select
                value={selectedToxicity}
                onChange={(e) => {
                  setSelectedToxicity(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] cursor-pointer"
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
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] cursor-pointer"
            >
              {usageMethodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* State Handling */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
            <Loader2 className="animate-spin text-[#2D7048]" size={24} />
            <span>กำลังโหลดข้อมูลสารเคมี...</span>
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
        ) : filteredChemicals.length === 0 ? (
          <div className="py-16 text-center bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg p-8 text-sm text-[#5A635D]">
            ไม่พบข้อมูลสารเคมีที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div>
            {/* Chemical Grid (4 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {pagedChemicals.map((chemical) => {
                const tox = TOXICITY_BADGE[chemical.toxicityLevel?.toLowerCase()] || {
                  label: chemical.toxicityLevel || 'ทั่วไป',
                  className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
                };

                return (
                  <Link
                    key={chemical.chemicalID}
                    href={`/chemicals/${chemical.chemicalID}`}
                    className="group bg-white hover:border-[#CDD2CF] hover:shadow-xs border border-[#E3E6E4] rounded-lg p-4 flex flex-col justify-between transition-all duration-150"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[13px] font-medium text-[#5A635D] truncate max-w-[130px]">
                          {getUsageMethodLabel(chemical.usageMethod) || 'สารเคมีกำจัดแมลง'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-sm border text-xs font-medium shrink-0 ${tox.className}`}>
                          {tox.label}
                        </span>
                      </div>

                      {/* Image */}
                      <div className="w-full h-36 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] overflow-hidden mb-3 relative flex items-center justify-center">
                        {chemical.chemicalImg ? (
                          <Image
                            src={chemical.chemicalImg}
                            alt={chemical.chemicalName}
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
                        {chemical.chemicalName}
                      </h3>
                      <p className="text-xs italic text-[#5A635D] mt-0.5 truncate">
                        {chemical.activeIngredient || '—'}
                      </p>

                      {/* Description */}
                      <p className="text-xs text-[#3F4742] line-clamp-2 mt-2 leading-relaxed">
                        {chemical.property || chemical.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>
                    </div>

                    {/* Actions & Meta */}
                    <div className="mt-4 pt-3 border-t border-[#E3E6E4] flex items-center justify-between">
                      <span className="text-xs text-[#5A635D] truncate max-w-[120px]" title={`อัตรา ${chemical.dosageRate} ${chemical.dosageUnit}`}>
                        {chemical.dosageRate} {chemical.dosageUnit}
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
                  แสดง {(currentPageSafe - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPageSafe * ITEMS_PER_PAGE, filteredChemicals.length)} จาก {filteredChemicals.length} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageSafe === 1}
                    className="p-2 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-[#1A1F1C] px-2">
                    {currentPageSafe} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageSafe === totalPages}
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