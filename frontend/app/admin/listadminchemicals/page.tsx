'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/app/components/shared/ToastContext';
import ConfirmDialog from '@/app/components/shared/ConfirmDialog';

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

const ROWS_PER_PAGE = 8;

export default function ChemicalManagement() {
  const router = useRouter();
  const toast = useToast();

  const [chemicals, setChemicals] = useState<ChemicalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

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
      setChemicals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  }, [doFetchChemicals]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadChemicals() {
      try {
        const data = await doFetchChemicals(controller.signal);
        if (!controller.signal.aborted) {
          setChemicals(Array.isArray(data) ? data : []);
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

  const handleDelete = (id: string, name: string) => {
    if (deletingId) return; // prevent double-click
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`${API_BASE_URL}/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `ลบไม่สำเร็จ (HTTP ${res.status})`);
      }
      setChemicals((prev) => prev.filter((c) => c.chemicalID !== deleteTarget.id));
      toast.success(`ลบข้อมูลสารเคมี "${deleteTarget.name}" สำเร็จ`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const filteredChemicals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return chemicals;
    return chemicals.filter(
      (c) =>
        c.chemicalName?.toLowerCase().includes(term) ||
        c.activeIngredient?.toLowerCase().includes(term) ||
        c.property?.toLowerCase().includes(term)
    );
  }, [chemicals, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredChemicals.length / ROWS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);
  const pagedChemicals = useMemo(() => {
    const start = (currentPageSafe - 1) * ROWS_PER_PAGE;
    return filteredChemicals.slice(start, start + ROWS_PER_PAGE);
  }, [filteredChemicals, currentPageSafe]);

  return (
    <div className="space-y-8 font-sans">

      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E3E6E4]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            จัดการข้อมูลสารเคมี
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            ทะเบียนสารเคมีกำจัดศัตรูข้าว สารออกฤทธิ์ อัตราการใช้ และคำแนะนำความปลอดภัย
          </p>
        </div>

        <Link
          href="/admin/addchemical"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={16} />
          <span>เพิ่มสารเคมีใหม่</span>
        </Link>
      </div>

      {/* Search Filter */}
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

        <span className="text-xs font-medium text-[#5A635D]">
          ทั้งหมด {filteredChemicals.length} รายการ
        </span>
      </div>

      {/* States */}
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
            onClick={fetchChemicals}
            className="mt-2 px-4 py-2 bg-white border border-[#CDD2CF] hover:bg-[#F1F3F2] text-[#1A1F1C] rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : filteredChemicals.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#E3E6E4] rounded-lg p-8 text-sm text-[#5A635D]">
          ไม่พบข้อมูลสารเคมีในระบบ
        </div>
      ) : (
        <div className="bg-white border border-[#E3E6E4] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E3E6E4] bg-[#F7F8F7] text-xs font-semibold text-[#5A635D]">
                  <th className="py-3 px-4 w-20">ภาพ</th>
                  <th className="py-3 px-4">ชื่อสารเคมี / สรรพคุณ</th>
                  <th className="py-3 px-4">สารออกฤทธิ์</th>
                  <th className="py-3 px-4">อัตราการใช้</th>
                  <th className="py-3 px-4">ระดับความเป็นพิษ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
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
                        {chemical.property && (
                          <div className="text-xs text-[#5A635D] mt-0.5 line-clamp-1">{chemical.property}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 italic text-[#5A635D]">
                        {chemical.activeIngredient || '—'}
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#1A1F1C]">
                        {chemical.dosageRate} {chemical.dosageUnit}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-medium border ${tox.className}`}>
                          {tox.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => router.push(`/admin/editchemical?chemicalId=${chemical.chemicalID}`)}
                            className="p-1.5 rounded-md bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            onClick={() => handleDelete(chemical.chemicalID, chemical.chemicalName)}
                            disabled={deletingId === chemical.chemicalID}
                            className="p-1.5 rounded-md bg-white hover:bg-[#FDECEA] border border-[#CDD2CF] hover:border-[#F4B9B3] text-[#5A635D] hover:text-[#B42318] transition-colors disabled:opacity-50 cursor-pointer"
                            title="ลบข้อมูล"
                          >
                            {deletingId === chemical.chemicalID ? (
                              <Loader2 size={13} className="animate-spin text-[#B42318]" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
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

      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="ยืนยันการลบข้อมูลสารเคมี"
          message={
            <p>
              คุณต้องการลบข้อมูล <strong>&quot;{deleteTarget.name}&quot;</strong> ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          }
          confirmLabel="ยืนยันการลบ"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deletingId === deleteTarget.id}
        />
      )}

    </div>
  );
}
