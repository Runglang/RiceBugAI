'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Plus,
  ArrowRight,
  Calculator,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
  MapPin,
  User,
  History,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface MemberData {
  memberID: string;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
}

interface GrowthStage {
  stageID: string;
  stageName: string;
}

interface RiceField {
  fieldID: string;
  fieldName: string;
  plantingDate: string;
  areaRai?: number | null;
  areaNgan?: number | null;
  areaSqWah?: number | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  riceAge: number;
  currentGrowthStage?: GrowthStage;
}

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [insectCount, setInsectCount] = useState<number | null>(null);
  const [chemicalCount, setChemicalCount] = useState<number | null>(null);

  const [fields, setFields] = useState<RiceField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [statsLoading, setStatsLoading] = useState(true);

  const fetchFields = useCallback(async (mId: string) => {
    try {
      setFieldsLoading(true);
      setFieldsError(null);
      const res = await fetch(`${API_URL}/api/v1/members/${mId}/fields`);
      if (!res.ok) throw new Error('โหลดข้อมูลแปลงนาไม่สำเร็จ');
      const data: RiceField[] = await res.json();
      setFields(Array.isArray(data) ? data : []);
    } catch (err) {
      setFieldsError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setFieldsLoading(false);
    }
  }, []);

  useEffect(() => {
    const sessionCookie = Cookies.get('member_session');
    if (!sessionCookie) {
      router.push('/member/login');
      return;
    }

    try {
      const parsedMember: MemberData = JSON.parse(sessionCookie);

      const initDashboard = async () => {
        setMember(parsedMember);
        await fetchFields(parsedMember.memberID);

        try {
          const [insectsRes, chemicalsRes] = await Promise.allSettled([
            fetch(`${API_URL}/api/v1/insects`),
            fetch(`${API_URL}/api/v1/chemicals`),
          ]);

          if (insectsRes.status === 'fulfilled' && insectsRes.value.ok) {
            const data = await insectsRes.value.json();
            setInsectCount(Array.isArray(data) ? data.length : 0);
          } else {
            setInsectCount(0);
          }

          if (chemicalsRes.status === 'fulfilled' && chemicalsRes.value.ok) {
            const data = await chemicalsRes.value.json();
            setChemicalCount(Array.isArray(data) ? data.length : 0);
          } else {
            setChemicalCount(0);
          }
        } catch {
          setInsectCount(0);
          setChemicalCount(0);
        } finally {
          setStatsLoading(false);
        }
      };

      initDashboard();
    } catch {
      router.push('/member/login');
    }
  }, [router, fetchFields]);

  const handleDelete = async (fieldID: string, fieldName: string) => {
    if (!member) return;

    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแปลง "${fieldName}"?`)) {
      return;
    }

    setIsDeletingId(fieldID);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/members/${member.memberID}/fields/${fieldID}`,
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

  const welcomeName = [member?.firstname, member?.lastname].filter(Boolean).join(' ') || member?.username || 'สมาชิก';

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#2D3730] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">

        {/* 1. Header / Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#E1E6E2] gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111813]">
              แดชบอร์ด
            </h1>
            <p className="text-sm text-[#4B5750] mt-0.5">
              ยินดีต้อนรับ, <span className="text-[#111813] font-semibold">{welcomeName}</span> — ภาพรวมแปลงเพาะปลูกและระบบช่วยตัดสินใจ
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Link
              href="/member/editprofile"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F1F4F2] border border-[#CBD3CE] text-[#111813] text-xs sm:text-sm font-medium h-9 px-3.5 rounded-lg transition-all shadow-2xs"
            >
              <User size={15} className="text-[#65716A]" />
              <span>ข้อมูลส่วนตัว</span>
            </Link>
          </div>
        </div>

        {/* 2. KPI Overview (3 compact metric tiles) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8">

          {/* Tile 1: แมลงศัตรูพืช */}
          <Link
            href="/member/listinsects"
            className="group relative bg-white hover:border-[#B2DEC3] border border-[#E1E6E2] rounded-xl p-4.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden"
          >
            <div className="text-xs font-medium text-[#65716A] mb-1">
              ฐานข้อมูลแมลงศัตรูข้าว
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111813] tabular-nums">
                {statsLoading ? '—' : insectCount ?? 0}
              </span>
              <span className="text-xs text-[#65716A]">ชนิดในระบบ</span>
            </div>
            <div className="text-xs text-[#156E3B] mt-2.5 flex items-center gap-1 font-semibold">
              <span>ดูข้อมูลแมลง</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Tile 2: สารเคมีเกษตร */}
          <Link
            href="/member/listchemicals"
            className="group relative bg-white hover:border-[#B5D4EE] border border-[#E1E6E2] rounded-xl p-4.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden"
          >
            <div className="text-xs font-medium text-[#65716A] mb-1">
              คลังสารเคมีกำจัดแมลง
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111813] tabular-nums">
                {statsLoading ? '—' : chemicalCount ?? 0}
              </span>
              <span className="text-xs text-[#65716A]">สูตรสารเคมี</span>
            </div>
            <div className="text-xs text-[#1B578A] mt-2.5 flex items-center gap-1 font-semibold">
              <span>ตรวจสอบสารเคมี</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Tile 3: แปลงนาที่บันทึกไว้ */}
          <div className="relative bg-white border border-[#E1E6E2] rounded-xl p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="text-xs font-medium text-[#65716A] mb-1">
              แปลงนาที่บันทึกไว้
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111813] tabular-nums">
                {fieldsLoading ? '—' : fields.length}
              </span>
              <span className="text-xs text-[#65716A]">แปลงที่กำลังดูแล</span>
            </div>
            <div className="text-xs text-[#25593A] mt-2.5 font-semibold">
              แสดงในรายการด้านล่าง
            </div>
          </div>

        </div>

        {/* 3. Main Content: 2 Columns Layout (Fields left, Workstations right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ── Left Column: แปลงนาของคุณ (7-8 cols on desktop) ── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">

            {/* Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E6E2]">
              <div>
                <h2 className="text-lg font-bold text-[#111813]">
                  แปลงนาของคุณ
                </h2>
                <p className="text-xs text-[#65716A] mt-0.5">
                  ติดตามอายุข้าว วิเคราะห์แมลงศัตรูพืช และคำนวณยาตามแปลง
                </p>
              </div>

              <Link
                href="/member/addfield"
                className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-lg bg-[#2D7048] hover:bg-[#25593A] text-white text-xs font-semibold transition-all shrink-0 shadow-2xs cursor-pointer"
              >
                <Plus size={14} />
                <span>เพิ่มแปลงนา</span>
              </Link>
            </div>

            {/* Fields Content */}
            {fieldsLoading ? (
              <div className="py-14 text-center bg-white border border-[#E1E6E2] rounded-xl flex flex-col items-center justify-center gap-2 text-xs text-[#65716A] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <Loader2 className="animate-spin text-[#2D7048]" size={22} />
                <span>กำลังโหลดข้อมูลแปลงนา...</span>
              </div>
            ) : fieldsError ? (
              <div className="py-8 text-center bg-[#FDECEA] border border-[#F4B9B3] rounded-xl p-5 text-xs text-[#B42318] flex flex-col items-center gap-2">
                <AlertCircle size={22} />
                <span>{fieldsError}</span>
                <button
                  onClick={() => member && fetchFields(member.memberID)}
                  className="mt-1 px-3 py-1 bg-white border border-[#CBD3CE] text-[#111813] rounded-lg text-xs font-medium hover:bg-[#F1F4F2] transition-colors cursor-pointer"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            ) : fields.length === 0 ? (
              <div className="py-12 text-center bg-white border border-[#E1E6E2] rounded-xl p-6 flex flex-col items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-bold text-[#111813]">ยังไม่มีข้อมูลแปลงนาในระบบ</h3>
                <p className="text-xs text-[#65716A] mt-1 max-w-xs">
                  เพิ่มข้อมูลแปลงนาเพื่อเริ่มติดตามอายุข้าว และส่งข้อมูลพื้นที่ไปคำนวณสารเคมีได้ทันที
                </p>
                <Link
                  href="/member/addfield"
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-lg bg-[#2D7048] hover:bg-[#25593A] text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>ลงทะเบียนแปลงแรก</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {fields.map((field) => {
                  const locationText = [field.subdistrict, field.district, field.province]
                    .filter(Boolean)
                    .join(', ');

                  const areaText = [
                    field.areaRai ? `${field.areaRai} ไร่` : '',
                    field.areaNgan ? `${field.areaNgan} งาน` : '',
                    field.areaSqWah ? `${field.areaSqWah} ตร.ว.` : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || '0 ไร่';

                  return (
                    <div
                      key={field.fieldID}
                      className="bg-white border border-[#E1E6E2] hover:border-[#CBD3CE] rounded-xl p-4 sm:p-4.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col gap-3"
                    >
                      {/* Top Row: Name + Stage Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[15px] font-bold text-[#111813] truncate">
                              {field.fieldName}
                            </h3>
                            <span className="inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full bg-[#E8F6ED] text-[#156E3B] border border-[#B2DEC3] font-semibold shrink-0">
                              {field.currentGrowthStage?.stageName || 'ไม่ระบุระยะ'}
                            </span>
                          </div>

                          {locationText && (
                            <div className="flex items-center gap-1 text-xs text-[#65716A] mt-1">
                              <MapPin size={12} className="text-[#939E97] shrink-0" />
                              <span className="truncate">{locationText}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics Strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#F8FAF8] border border-[#E1E6E2] rounded-lg text-xs">
                        <div>
                          <div className="text-[11px] text-[#65716A] font-medium">วันที่เริ่มปลูก</div>
                          <div className="font-semibold text-[#111813] mt-0.5 truncate">
                            {field.plantingDate || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#65716A] font-medium">ขนาดพื้นที่</div>
                          <div className="font-semibold text-[#111813] mt-0.5 truncate">
                            {areaText}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#65716A] font-medium">อายุข้าว</div>
                          <div className="font-bold text-[#156E3B] mt-0.5">
                            {field.riceAge} วัน
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions Row (Balanced Twins) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E1E6E2] flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Action 1: วิเคราะห์แมลง */}
                          <Link
                            href={`/member/analysisinsect?fieldID=${field.fieldID}`}
                            className="px-3 h-8.5 rounded-lg bg-[#E8F6ED] hover:bg-[#2D7048] text-[#156E3B] hover:text-white border border-[#B2DEC3] hover:border-[#2D7048] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs group cursor-pointer"
                          >
                            <Sparkles size={13} className="text-[#156E3B] group-hover:text-white transition-colors" />
                            <span>วิเคราะห์แมลง</span>
                          </Link>

                          {/* Action 2: คำนวณยา */}
                          <Link
                            href={`/member/calculation?fieldID=${field.fieldID}`}
                            className="px-3 h-8.5 rounded-lg bg-[#EAF3FB] hover:bg-[#1B578A] text-[#1B578A] hover:text-white border border-[#B5D4EE] hover:border-[#1B578A] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs group cursor-pointer"
                          >
                            <Calculator size={13} className="text-[#1B578A] group-hover:text-white transition-colors" />
                            <span>คำนวณยา</span>
                          </Link>
                        </div>

                        <button
                          onClick={() => handleDelete(field.fieldID, field.fieldName)}
                          disabled={isDeletingId === field.fieldID}
                          className="h-8.5 px-2.5 rounded-lg bg-white hover:bg-[#FDECEA] border border-[#CBD3CE] hover:border-[#F4B9B3] text-[#65716A] hover:text-[#B42318] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
                          title="ลบแปลงนา"
                        >
                          {isDeletingId === field.fieldID ? (
                            <Loader2 size={13} className="animate-spin text-[#B42318]" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* ── Right Column: ระบบงานหลัก / เมนูด่วน (4-5 cols on desktop) ── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">

            {/* Section Header */}
            <div className="pb-2 border-b border-[#E1E6E2]">
              <h2 className="text-lg font-bold text-[#111813]">
                ระบบงานหลัก
              </h2>
              <p className="text-xs text-[#65716A] mt-0.5">
                เครื่องมือช่วยตัดสินใจและจัดการข้อมูล
              </p>
            </div>

            {/* Compact Workstation Action Cards */}
            <div className="space-y-3">

              {/* Item 1: วิเคราะห์แมลงศัตรูข้าว */}
              <div className="bg-white border border-[#E1E6E2] hover:border-[#B2DEC3] rounded-xl p-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E8F6ED] border border-[#B2DEC3] flex items-center justify-center text-[#156E3B] shrink-0 mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111813]">
                      วิเคราะห์แมลงศัตรูข้าว AI
                    </h3>
                    <p className="text-xs text-[#65716A] mt-0.5 leading-relaxed">
                      อัปโหลดรูปภาพเพื่อจำแนกชนิดแมลงศัตรูพืชตามระยะข้าว
                    </p>
                    <div className="mt-3">
                      <Link
                        href="/member/analysisinsect"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#156E3B] hover:text-[#25593A] transition-colors"
                      >
                        <span>เริ่มวิเคราะห์</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item 2: คำนวณปริมาณสารเคมี */}
              <div className="bg-white border border-[#E1E6E2] hover:border-[#B5D4EE] rounded-xl p-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EAF3FB] border border-[#B5D4EE] flex items-center justify-center text-[#1B578A] shrink-0 mt-0.5">
                    <Calculator size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111813]">
                      คำนวณปริมาณสารเคมี
                    </h3>
                    <p className="text-xs text-[#65716A] mt-0.5 leading-relaxed">
                      คำนวณสูตรและอัตราผสมยาตามขนาดพื้นที่จริง
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                      <Link
                        href="/member/calculation"
                        className="inline-flex items-center gap-1 text-[#1B578A] hover:text-[#163423] transition-colors"
                      >
                        <span>เปิดเครื่องมือคำนวณ</span>
                        <ArrowRight size={12} />
                      </Link>
                      <Link
                        href="/member/calculationresult"
                        className="inline-flex items-center gap-1 text-[#65716A] hover:text-[#111813] font-medium transition-colors"
                      >
                        <History size={11} />
                        <span>ผลล่าสุด</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item 3: ข้อมูลส่วนตัว & จัดการระบบ */}
              <div className="bg-white border border-[#E1E6E2] hover:border-[#CBD3CE] rounded-xl p-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F1F4F2] border border-[#CBD3CE] flex items-center justify-center text-[#4B5750] shrink-0 mt-0.5">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111813]">
                      จัดการข้อมูลส่วนตัว
                    </h3>
                    <p className="text-xs text-[#65716A] mt-0.5 leading-relaxed">
                      อัปเดตชื่อ-นามสกุล อีเมล และที่อยู่สำหรับติดต่อ
                    </p>
                    <div className="mt-3">
                      <Link
                        href="/member/editprofile"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111813] hover:text-[#2D7048] transition-colors"
                      >
                        <span>แก้ไขโปรไฟล์</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
