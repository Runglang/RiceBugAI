'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';

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

const ALL_STAGES = 'ทุกระยะการเจริญเติบโต';
const ITEMS_PER_PAGE = 8;

export default function InsectManagement() {
  const router = useRouter();

  const [insects, setInsects] = useState<InsectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState(ALL_STAGES);
  const [page, setPage] = useState(1);

  const doFetchInsects = useCallback(async (signal?: AbortSignal): Promise<InsectDTO[]> => {
    const res = await fetch(API_BASE_URL, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const fetchInsects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await doFetchInsects();
      setInsects(Array.isArray(data) ? data : []);
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบฐานข้อมูลได้ในขณะนี้');
    } finally {
      setLoading(false);
    }
  }, [doFetchInsects]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadInsects() {
      try {
        const data = await doFetchInsects(controller.signal);
        if (!controller.signal.aborted) {
          setInsects(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('ไม่สามารถเชื่อมต่อกับระบบฐานข้อมูลได้ในขณะนี้');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    loadInsects();
    return () => { controller.abort(); };
  }, [doFetchInsects]);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลแมลง "${name}"?`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('ไม่สามารถลบข้อมูลได้ในขณะนี้');
      }
      setInsects((prev) => prev.filter((i) => i.insectID !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ไม่สามารถลบข้อมูลได้ในขณะนี้');
    } finally {
      setDeletingId(null);
    }
  };

  const stageOptions = useMemo(() => {
    const stageNames = new Set<string>();
    insects.forEach((insect) => {
      insect.riceGrowthStages?.forEach((stage) => {
        if (stage.stageName) stageNames.add(stage.stageName.trim());
      });
    });
    return [ALL_STAGES, ...Array.from(stageNames).sort()];
  }, [insects]);

  const filteredInsects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return insects.filter((insect) => {
      const matchesSearch =
        term === '' ||
        insect.insectName?.toLowerCase().includes(term) ||
        insect.scientificName?.toLowerCase().includes(term) ||
        insect.insectType?.toLowerCase().includes(term);

      const matchesStage =
        selectedStage === ALL_STAGES ||
        insect.riceGrowthStages?.some((stage) => stage.stageName?.trim() === selectedStage);

      return matchesSearch && matchesStage;
    });
  }, [insects, searchTerm, selectedStage]);

  const totalPages = Math.max(1, Math.ceil(filteredInsects.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);
  const pagedInsects = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredInsects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInsects, currentPageSafe]);

  return (
    <div className="space-y-8 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E3E6E4]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            จัดการข้อมูลแมลงศัตรูข้าว
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            จัดการทะเบียนข้อมูลสัณฐานวิทยาชีวภาพ รูปภาพตัวอย่าง และระยะการเข้าทำลายผลผลิตข้าว
          </p>
        </div>

        <Link
          href="/admin/addinsect"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={16} />
          <span>เพิ่มแมลงใหม่</span>
        </Link>
      </div>

      {/* Search & Filter Matrix */}
      <div className="bg-white border border-[#E3E6E4] rounded-lg p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA29D]" />
          <input
            type="text"
            placeholder="ค้นหาชื่อแมลง, ชื่อวิทยาศาสตร์, ประเภท..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={14} className="text-[#5A635D] shrink-0" />
          <select
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-auto px-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] cursor-pointer"
          >
            {stageOptions.map((st) => (
              <option key={st} value={st}>
                ระยะข้าว: {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
          <Loader2 className="animate-spin text-[#2D7048]" size={24} />
          <span>กำลังโหลดข้อมูลทะเบียนแมลง...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-6 text-sm text-[#B42318] flex flex-col items-center gap-2">
          <AlertCircle size={24} />
          <span>{error}</span>
          <button
            onClick={fetchInsects}
            className="mt-2 px-4 py-2 bg-white border border-[#CDD2CF] hover:bg-[#F1F3F2] text-[#1A1F1C] rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : filteredInsects.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#E3E6E4] rounded-lg p-8 text-sm text-[#5A635D]">
          ไม่พบข้อมูลแมลงในระบบ
        </div>
      ) : (
        <div>
          {/* Insect Grid (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {pagedInsects.map((insect) => {
              const danger = DANGER_BADGE[insect.dangerLevel?.toLowerCase()] || {
                label: insect.dangerLevel || 'ทั่วไป',
                className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
              };

              const firstImg = insect.insectImg && insect.insectImg.length > 0 ? insect.insectImg[0] : null;

              return (
                <div
                  key={insect.insectID}
                  className="bg-white border border-[#E3E6E4] rounded-lg p-4 flex flex-col justify-between hover:border-[#CDD2CF] transition-all"
                >
                  <div>
                    {/* Top Bar */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-[13px] font-medium text-[#5A635D]">{insect.insectType || 'แมลงศัตรูข้าว'}</span>
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
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs text-[#9AA29D]">ไม่มีรูปภาพ</span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-semibold text-[#1A1F1C] leading-snug">
                      {insect.insectName}
                    </h3>
                    <p className="text-xs italic text-[#5A635D] mt-0.5 truncate">
                      {insect.scientificName || '—'}
                    </p>

                    <p className="text-xs text-[#3F4742] line-clamp-2 mt-2 leading-relaxed">
                      {insect.insectDes || 'ไม่มีคำอธิบายเพิ่มเติม'}
                    </p>
                  </div>

                  {/* Actions & Meta */}
                  <div className="mt-4 pt-3 border-t border-[#E3E6E4] flex items-center justify-between">
                    <span className="text-xs text-[#5A635D] truncate max-w-[120px]">
                      {insect.riceGrowthStages?.map((s) => s.stageName).join(', ') || 'ทุกระยะ'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/admin/editinsect?insectId=${insect.insectID}`)}
                        className="p-1.5 rounded-md bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] transition-colors cursor-pointer"
                        title="แก้ไขข้อมูล"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        onClick={() => handleDelete(insect.insectID, insect.insectName)}
                        disabled={deletingId === insect.insectID}
                        className="p-1.5 rounded-md bg-white hover:bg-[#FDECEA] border border-[#CDD2CF] hover:border-[#F4B9B3] text-[#5A635D] hover:text-[#B42318] transition-colors disabled:opacity-50 cursor-pointer"
                        title="ลบข้อมูล"
                      >
                        {deletingId === insect.insectID ? (
                          <Loader2 size={13} className="animate-spin text-[#B42318]" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-[#E3E6E4]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPageSafe === 1}
                className="p-2 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-medium text-[#5A635D] px-3">
                หน้า {currentPageSafe} จาก {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageSafe === totalPages}
                className="p-2 bg-white hover:bg-[#F1F3F2] disabled:opacity-40 border border-[#CDD2CF] rounded-md text-[#1A1F1C] transition-colors cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
