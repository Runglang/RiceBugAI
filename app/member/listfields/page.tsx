'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface GrowthStage {
  stageID: string;
  stageName: string;
}

export interface RiceField {
  fieldID: string;
  fieldName: string;
  plantingDate: string;
  areaSize: number;
  areaUnit: string;
  riceAge: number;
  currentGrowthStage?: GrowthStage;
}

export default function MyFieldsPage() {
  const router = useRouter();

  const [fields, setFields] = useState<RiceField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberID, setMemberID] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchFields = useCallback(async (mId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/v1/members/${mId}/fields`);
      if (!res.ok) throw new Error('โหลดข้อมูลแปลงนาไม่สำเร็จ');
      const data: RiceField[] = await res.json();
      setFields(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = Cookies.get('member_session');
    if (!session) {
      router.push('/member/login');
      return;
    }
    try {
      const member = JSON.parse(session);
      setMemberID(member.memberID);
      fetchFields(member.memberID);
    } catch {
      router.push('/member/login');
    }
  }, [router, fetchFields]);

  const handleDelete = async (fieldID: string, fieldName: string) => {
    if (!memberID) return;

    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแปลง "${fieldName}"?`)) {
      return;
    }

    setIsDeletingId(fieldID);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/members/${memberID}/fields/${fieldID}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('ลบข้อมูลแปลงนาไม่สำเร็จ');
      }

      setFields((prev) => prev.filter((f) => f.fieldID !== fieldID));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-4xl mx-auto px-6 pt-8">

        {/* Header Strip */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
              แปลงนาข้าวของฉัน
            </h1>
            <p className="text-sm text-[#5A635D] mt-1">
              ทะเบียนแปลงเพาะปลูก ติดตามอายุข้าว และระยะการเจริญเติบโตปัจจุบัน
            </p>
          </div>

          <Link
            href="/member/addfield"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={16} />
            <span>เพิ่มแปลงนาใหม่</span>
          </Link>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
            <Loader2 className="animate-spin text-[#2D7048]" size={24} />
            <span>กำลังโหลดข้อมูลแปลงนา...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-lg p-6 text-sm text-[#B42318] flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error}</span>
            <button
              onClick={() => memberID && fetchFields(memberID)}
              className="mt-2 px-3 py-1.5 bg-white border border-[#CDD2CF] text-[#1A1F1C] rounded-md text-sm font-medium hover:bg-[#F1F3F2] transition-colors cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : fields.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#E3E6E4] rounded-lg p-8 flex flex-col items-center">
            <h3 className="text-base font-bold text-[#1A1F1C]">ยังไม่มีข้อมูลแปลงนาในระบบ</h3>
            <p className="text-sm text-[#5A635D] mt-1 max-w-sm">
              เพิ่มข้อมูลแปลงนาเพื่อเริ่มคำนวณอายุข้าวและใช้เครื่องมือคำนวณสารเคมีกำจัดศัตรูพืช
            </p>
            <Link
              href="/member/addfield"
              className="mt-5 inline-flex items-center gap-2 px-4 h-10 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium transition-colors"
            >
              <Plus size={15} />
              <span>ลงทะเบียนแปลงนาแรก</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.fieldID}
                className="bg-white border border-[#E3E6E4] rounded-lg p-5 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-[#1A1F1C] truncate">
                      {field.fieldName}
                    </h3>
                    <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-sm bg-[#E8F5EC] text-[#1E7B45] border border-[#B7DFC6] font-medium">
                      {field.currentGrowthStage?.stageName || 'ไม่ระบุระยะ'}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
                    <div>
                      <div className="text-xs text-[#5A635D]">วันที่เริ่มปลูก</div>
                      <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">
                        {field.plantingDate || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#5A635D]">ขนาดพื้นที่</div>
                      <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">
                        {field.areaSize} {field.areaUnit || 'ไร่'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#5A635D]">อายุข้าว</div>
                      <div className="text-sm font-bold text-[#2D7048] mt-0.5">
                        {field.riceAge} วัน
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#E3E6E4]">
                  <Link
                    href="/member/calculation"
                    className="px-3.5 h-9 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>คำนวณยา</span>
                    <ArrowRight size={13} />
                  </Link>

                  <button
                    onClick={() => handleDelete(field.fieldID, field.fieldName)}
                    disabled={isDeletingId === field.fieldID}
                    className="h-9 px-3 rounded-md bg-white hover:bg-[#FDECEA] border border-[#CDD2CF] hover:border-[#F4B9B3] text-[#5A635D] hover:text-[#B42318] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                    title="ลบแปลงนา"
                  >
                    {isDeletingId === field.fieldID ? (
                      <Loader2 size={15} className="animate-spin text-[#B42318]" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
