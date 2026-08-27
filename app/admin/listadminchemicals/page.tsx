'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, FlaskConical } from 'lucide-react';

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
  toxicityLevel: string; // 'ต่ำ' | 'กลาง' | 'สูง' ตามที่ฟอร์ม add/edit ส่งไปจริง
  chemicalImg?: string | null;
  description: string;
  warning: string;
  targetInsects: InsectRefDTO[];
}

// แก้ key ให้ตรงกับค่าจริงที่ AddChemicalPage ส่งไป (code ภาษาอังกฤษ ไม่ใช่ข้อความไทยตรงๆ)
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

export default function ChemicalManagement() {
  const router = useRouter();

  const [chemicals, setChemicals] = useState<ChemicalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // แยกฟังก์ชัน fetch ล้วนๆ สำหรับให้เรียกใช้ร่วมกันได้
  const doFetchChemicals = useCallback(async (signal?: AbortSignal): Promise<ChemicalDTO[]> => {
    const res = await fetch(API_BASE_URL, { signal });
    if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
    return res.json();
  }, []);

  // สำหรับปุ่ม "ลองใหม่อีกครั้ง"
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

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`ต้องการลบ "${name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `ลบไม่สำเร็จ (HTTP ${res.status})`);
      }
      setChemicals((prev) => prev.filter((c) => c.chemicalID !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  // หมายเหตุ: GET /api/v1/chemicals ยังไม่รองรับ pagination ฝั่ง backend (คืนข้อมูลทั้งหมดมาทีเดียว)
  // จึงทำ pagination แบบฝั่ง client ไปก่อน ถ้า backend เพิ่ม page/size พารามิเตอร์ทีหลัง ค่อยเปลี่ยนมาใช้ server-side pagination
  const totalPages = Math.max(1, Math.ceil(chemicals.length / ROWS_PER_PAGE));
  const currentPageSafe = Math.min(page, totalPages);
  const pagedChemicals = chemicals.slice(
    (currentPageSafe - 1) * ROWS_PER_PAGE,
    currentPageSafe * ROWS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 sm:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              จัดการข้อมูลสารเคมี
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              การจัดการฐานข้อมูลสารเคมีสำหรับคำแนะนำการใช้ในนาข้าว
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/addchemical')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e2e8f0] hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            เพิ่มสารเคมีใหม่
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังโหลดข้อมูล...
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchChemicals}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && chemicals.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <FlaskConical className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูลสารเคมีในระบบ</p>
            </div>
          )}

          {/* Data table */}
          {!loading && !error && chemicals.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 w-24">รูปภาพ</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 w-1/4">ชื่อสารเคมี</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 w-1/3">ส่วนประกอบสำคัญ</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 w-32">ความเป็นพิษ</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pagedChemicals.map((chemical) => (
                      <tr key={chemical.chemicalID} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="w-12 h-12 rounded-lg shadow-inner overflow-hidden relative bg-slate-100">
                            {chemical.chemicalImg ? (
                              // chemicalImg เป็น URL เต็มจาก backend (เช่น http://localhost:8080/uploads/chemicals/xxx.jpg)
                              // ใช้ unoptimized เพราะยังไม่ได้ตั้งค่า remotePatterns ใน next.config.js สำหรับ host นี้
                              <Image
                                src={chemical.chemicalImg}
                                alt={chemical.chemicalName}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <FlaskConical className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 text-sm">{chemical.chemicalName}</div>
                          {chemical.property && (
                            <div className="text-xs text-slate-400 mt-0.5">{chemical.property}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-400 italic font-serif text-sm">
                          {chemical.activeIngredient}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              TOXICITY_STYLE[chemical.toxicityLevel] ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {TOXICITY_LABEL[chemical.toxicityLevel] ?? chemical.toxicityLevel}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            <button
                              onClick={() => router.push(`/admin/editchemical?chemicalId=${chemical.chemicalID}`)}
                              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all"
                              aria-label="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(chemical.chemicalID, chemical.chemicalName)}
                              disabled={deletingId === chemical.chemicalID}
                              className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
                              aria-label="Delete"
                            >
                              {deletingId === chemical.chemicalID ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                <span className="text-sm text-slate-500 font-medium">
                  แสดงสารเคมี {(currentPageSafe - 1) * ROWS_PER_PAGE + 1} ถึง{' '}
                  {Math.min(currentPageSafe * ROWS_PER_PAGE, chemicals.length)} รายการ จากทั้งหมด {chemicals.length} รายการ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageSafe === 1}
                    className="px-4 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageSafe === totalPages}
                    className="px-4 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    ต่อไป
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