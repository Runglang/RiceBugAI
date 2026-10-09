'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface InsectDTO {
  insectID: string;
  insectName: string;
  scientificName: string;
  insectType: string;
  dangerLevel: string;
  insectDes?: string;
  insectImg?: string[] | null;
}

const DANGER_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: 'ระดับสูง', className: 'bg-[#FDECEA] text-[#B42318] border-[#F4B9B3]' },
  medium: { label: 'ปานกลาง', className: 'bg-[#FFF4E0] text-[#8A5300] border-[#F0D29A]' },
  low: { label: 'ระดับต่ำ', className: 'bg-[#E8F5EC] text-[#1E7B45] border-[#B7DFC6]' },
};

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function AdminDashboard() {
  const router = useRouter();

  const [insects, setInsects] = useState<InsectDTO[]>([]);
  const [chemicalCount, setChemicalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal ยืนยันการลบ
  const [deleteTarget, setDeleteTarget] = useState<InsectDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. ตรวจสอบสิทธิ์ Admin Session
  useEffect(() => {
    const sessionCookie = Cookies.get('admin_session');
    if (!sessionCookie) {
      router.push('/admin/login');
    }
  }, [router]);

  // 2. Fetch ข้อมูลสำหรับ Dashboard
  useEffect(() => {
    let ignore = false;
    const loadDashboardData = async () => {
      try {
        const [insectsRes, chemicalsRes] = await Promise.allSettled([
          fetch(`${API_ORIGIN}/api/v1/insects`),
          fetch(`${API_ORIGIN}/api/v1/chemicals`),
        ]);

        if (insectsRes.status === 'fulfilled' && insectsRes.value.ok) {
          const data: InsectDTO[] = await insectsRes.value.json();
          if (!ignore) setInsects(Array.isArray(data) ? data : []);
        } else {
          if (!ignore) setInsects([]);
        }

        if (chemicalsRes.status === 'fulfilled' && chemicalsRes.value.ok) {
          const chemData = await chemicalsRes.value.json();
          if (!ignore) setChemicalCount(Array.isArray(chemData) ? chemData.length : 0);
        } else {
          if (!ignore) setChemicalCount(0);
        }
      } catch {
        if (!ignore) setErrorMsg('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // 3. จัดการการลบข้อมูล
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_ORIGIN}/api/v1/insects/${deleteTarget.insectID}`, {
        method: 'DELETE',
      });

      if (res.ok || res.status === 204) {
        setSuccessMsg(`ลบข้อมูลแมลง "${deleteTarget.insectName}" สำเร็จ`);
        setDeleteTarget(null);
        setLoading(true);
        setRefreshKey((k) => k + 1);
      } else {
        setErrorMsg('ไม่สามารถลบข้อมูลได้ในขณะนี้');
        setDeleteTarget(null);
      }
    } catch {
      setErrorMsg('ไม่สามารถลบข้อมูลได้ในขณะนี้');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const recentInsects = insects.slice(0, 5);

  return (
    <div className="space-y-8 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E3E6E4] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            จัดการฐานข้อมูลสัณฐานวิทยาแมลงศัตรูพืชและสารเคมีป้องกันกำจัดในระบบ RiceBugAI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/addinsect"
            className="inline-flex items-center gap-1.5 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-4 rounded-md transition-colors"
          >
            <Plus size={16} />
            <span>เพิ่มแมลงใหม่</span>
          </Link>
          <Link
            href="/admin/addchemical"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-4 rounded-md transition-colors"
          >
            <Plus size={16} />
            <span>เพิ่มสารเคมีใหม่</span>
          </Link>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-3.5 bg-[#E8F5EC] border border-[#B7DFC6] rounded-md text-xs text-[#1E7B45] flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#1E7B45]" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-[#1E7B45] hover:underline cursor-pointer">ปิด</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-[#FDECEA] border border-[#F4B9B3] rounded-md text-xs text-[#B42318] flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#B42318]" /> {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-xs text-[#B42318] hover:underline cursor-pointer">ปิด</button>
        </div>
      )}

      {/* Inventory KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card 1: แมลงศัตรูพืช */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-[#5A635D] mb-1">
              ข้อมูลแมลงศัตรูพืช
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#1A1F1C] tabular-nums">
                {loading ? '—' : insects.length}
              </span>
              <span className="text-xs text-[#5A635D]">ชนิดในฐานข้อมูล</span>
            </div>
            <p className="text-xs text-[#5A635D] mt-2 leading-relaxed">
              ฐานข้อมูลลักษณะทางชีววิทยา สัณฐานวิทยา และระยะการเข้าทำลายต้นข้าว
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#E3E6E4]">
            <Link
              href="/admin/listadmininsects"
              className="flex-1 inline-flex items-center justify-center bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-3 rounded-md transition-colors"
            >
              <span>จัดการรายการแมลง</span>
            </Link>
            <Link
              href="/admin/addinsect"
              className="inline-flex items-center justify-center gap-1.5 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-4 rounded-md transition-colors"
            >
              <Plus size={15} />
              <span>เพิ่มแมลง</span>
            </Link>
          </div>
        </div>

        {/* Card 2: สารเคมีกำจัดแมลง */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-[#5A635D] mb-1">
              ข้อมูลสารเคมีกำจัดศัตรูพืช
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#1A1F1C] tabular-nums">
                {loading ? '—' : chemicalCount ?? 0}
              </span>
              <span className="text-xs text-[#5A635D]">สูตรในระบบ</span>
            </div>
            <p className="text-xs text-[#5A635D] mt-2 leading-relaxed">
              สารออกฤทธิ์ อัตราผสมน้ำ และการจับคู่กับแมลงเป้าหมายตามสูตรการใช้
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#E3E6E4]">
            <Link
              href="/admin/listadminchemicals"
              className="flex-1 inline-flex items-center justify-center bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-3 rounded-md transition-colors"
            >
              <span>จัดการรายการสารเคมี</span>
            </Link>
            <Link
              href="/admin/addchemical"
              className="inline-flex items-center justify-center gap-1.5 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-4 rounded-md transition-colors"
            >
              <Plus size={15} />
              <span>เพิ่มสารเคมี</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Recent Insect Registry Table */}
      <div className="bg-white border border-[#E3E6E4] rounded-lg overflow-hidden">

        <div className="px-5 py-4 bg-[#F7F8F7] border-b border-[#E3E6E4] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1A1F1C]">
              ข้อมูลแมลงล่าสุดในระบบ
            </h2>
            <span className="text-xs text-[#5A635D]">แสดง 5 รายการล่าสุดในฐานข้อมูล</span>
          </div>

          <Link
            href="/admin/listadmininsects"
            className="text-xs font-medium text-[#2D7048] hover:text-[#25593A] inline-flex items-center gap-1"
          >
            <span>ดูทั้งหมด ({insects.length})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#5A635D] flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#2D7048]" size={20} />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        ) : recentInsects.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5A635D]">
            ไม่พบข้อมูลแมลงในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F7] text-[#5A635D] font-semibold border-b border-[#E3E6E4]">
                <tr>
                  <th className="py-3 px-5">ชื่อแมลง</th>
                  <th className="py-3 px-5">ชื่อวิทยาศาสตร์</th>
                  <th className="py-3 px-5">ประเภทแมลง</th>
                  <th className="py-3 px-5">ระดับอันตราย</th>
                  <th className="py-3 px-5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6E4] bg-white text-[#3F4742]">
                {recentInsects.map((insect) => {
                  const danger = DANGER_BADGE[insect.dangerLevel?.toLowerCase()] || {
                    label: insect.dangerLevel || '—',
                    className: 'bg-[#F1F3F2] text-[#3F4742] border-[#E3E6E4]',
                  };

                  return (
                    <tr key={insect.insectID} className="hover:bg-[#F7F8F7] transition-colors">
                      <td className="py-3 px-5 font-bold text-[#1A1F1C]">
                        {insect.insectName}
                      </td>
                      <td className="py-3 px-5 italic text-[#5A635D]">
                        {insect.scientificName || '—'}
                      </td>
                      <td className="py-3 px-5 text-[#3F4742]">
                        {insect.insectType || '—'}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 rounded-sm border text-[11px] font-medium ${danger.className}`}>
                          {danger.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/editinsect?insectId=${insect.insectID}`}
                            className="p-1.5 text-[#5A635D] hover:text-[#1A1F1C] hover:bg-[#F1F3F2] rounded-md transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(insect)}
                            className="p-1.5 text-[#5A635D] hover:text-[#B42318] hover:bg-[#FDECEA] rounded-md transition-colors cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#1A1F1C]/75 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E6E4] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDECEA] text-[#B42318] flex items-center justify-center shrink-0 border border-[#F4B9B3]">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1F1C]">
                  ยืนยันการลบข้อมูลแมลง
                </h3>
                <p className="text-xs text-[#5A635D] mt-1 leading-relaxed">
                  คุณต้องการลบข้อมูล <strong>&quot;{deleteTarget.insectName}&quot;</strong> ใช่หรือไม่? ข้อมูลนี้จะถูกลบออกจากฐานข้อมูลอย่างถาวร
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3E6E4]">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="h-9 px-4 text-xs font-medium text-[#1A1F1C] hover:bg-[#F1F3F2] bg-white border border-[#CDD2CF] rounded-md transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-[#B42318] hover:bg-[#911C13] rounded-md transition-colors cursor-pointer"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                <span>ยืนยันการลบ</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
