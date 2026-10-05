'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Plus, ArrowRight, Calculator } from 'lucide-react';

interface MemberData {
  memberID: string;
  username: string;
  email: string;
}

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [insectCount, setInsectCount] = useState<number | null>(null);
  const [chemicalCount, setChemicalCount] = useState<number | null>(null);
  const [fieldCount, setFieldCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. ตรวจสอบ Member Session
    const sessionCookie = Cookies.get('member_session');
    if (!sessionCookie) {
      router.push('/member/login');
      return;
    }

    try {
      const parsedMember = JSON.parse(sessionCookie);
      setMember(parsedMember);

      // 2. Fetch ข้อมูลทางสถิติจาก API
      const fetchData = async () => {
        try {
          const [insectsRes, chemicalsRes, fieldsRes] = await Promise.allSettled([
            fetch('http://localhost:8080/api/v1/insects'),
            fetch('http://localhost:8080/api/v1/chemicals'),
            fetch(`http://localhost:8080/api/v1/members/${parsedMember.memberID}/fields`),
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

          if (fieldsRes.status === 'fulfilled' && fieldsRes.value.ok) {
            const data = await fieldsRes.value.json();
            setFieldCount(Array.isArray(data) ? data.length : 0);
          } else {
            setFieldCount(0);
          }
        } catch {
          setInsectCount(0);
          setChemicalCount(0);
          setFieldCount(0);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } catch {
      router.push('/member/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      {/* Container */}
      <div className="max-w-6xl mx-auto px-6 pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-[#E3E6E4] gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
              แดชบอร์ด
            </h1>
            <p className="text-sm text-[#5A635D] mt-1">
              ยินดีต้อนรับ, <span className="text-[#1A1F1C] font-semibold">{member?.username || 'สมาชิก'}</span> — ภาพรวมแปลงนาและระบบคำนวณสารเคมี
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/member/calculation"
              className="inline-flex items-center gap-2 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-4 rounded-md transition-colors"
            >
              <Calculator size={16} />
              <span>คำนวณสารเคมี</span>
            </Link>
            <Link
              href="/member/addfield"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-4 rounded-md transition-colors"
            >
              <Plus size={16} />
              <span>เพิ่มแปลงนา</span>
            </Link>
          </div>
        </div>

        {/* Real KPI Metrics Matrix (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

          {/* Tile 1: แมลงศัตรูพืช */}
          <Link
            href="/member/listinsects"
            className="group block bg-white hover:border-[#CDD2CF] hover:shadow-xs border border-[#E3E6E4] rounded-lg p-5 transition-all"
          >
            <div className="text-sm text-[#5A635D] mb-1">
              ฐานข้อมูลแมลงศัตรูข้าว
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#1A1F1C] tabular-nums">
                {loading ? '—' : insectCount ?? 0}
              </span>
              <span className="text-xs text-[#5A635D]">ชนิดในระบบ</span>
            </div>
            <div className="text-xs text-[#2D7048] mt-3 flex items-center gap-1 font-medium">
              <span>ดูข้อมูลแมลง</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Tile 2: สารเคมีเกษตร */}
          <Link
            href="/member/listchemicals"
            className="group block bg-white hover:border-[#CDD2CF] hover:shadow-xs border border-[#E3E6E4] rounded-lg p-5 transition-all"
          >
            <div className="text-sm text-[#5A635D] mb-1">
              คลังสารเคมีกำจัดแมลง
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#1A1F1C] tabular-nums">
                {loading ? '—' : chemicalCount ?? 0}
              </span>
              <span className="text-xs text-[#5A635D]">สูตรสารเคมี</span>
            </div>
            <div className="text-xs text-[#2D7048] mt-3 flex items-center gap-1 font-medium">
              <span>ตรวจสอบสารเคมี</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Tile 3: แปลงนาของคุณ */}
          <Link
            href="/member/listfields"
            className="group block bg-white hover:border-[#CDD2CF] hover:shadow-xs border border-[#E3E6E4] rounded-lg p-5 transition-all"
          >
            <div className="text-sm text-[#5A635D] mb-1">
              แปลงนาที่บันทึกไว้
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-[#1A1F1C] tabular-nums">
                {loading ? '—' : fieldCount ?? 0}
              </span>
              <span className="text-xs text-[#5A635D]">แปลงที่กำลังดูแล</span>
            </div>
            <div className="text-xs text-[#2D7048] mt-3 flex items-center gap-1 font-medium">
              <span>จัดการแปลงนา</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

        </div>

        {/* Workstations (2x2 Grid) */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1A1F1C]">
            ระบบงานหลัก
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Workstation 1: จัดการแปลงนา */}
          <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1A1F1C]">จัดการแปลงนาข้าว</h3>
              <p className="text-sm text-[#5A635D] leading-relaxed mt-2 mb-6">
                ระบบคำนวณอายุข้าวและประเมินระยะการเจริญเติบโต (กล้า, แตกกอ, ตั้งท้อง, ออกรวง, สุกแก่) อัตโนมัติ เพื่อเฝ้าระวังศัตรูพืชที่มักระบาดในแต่ละช่วง
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-[#E3E6E4]">
              <Link
                href="/member/listfields"
                className="flex-1 inline-flex items-center justify-center bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-4 rounded-md transition-colors"
              >
                <span>ดูแปลงนาทั้งหมด</span>
              </Link>
              <Link
                href="/member/addfield"
                className="inline-flex items-center justify-center gap-1 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-4 rounded-md transition-colors"
              >
                <Plus size={15} />
                <span>เพิ่มแปลงนา</span>
              </Link>
            </div>
          </div>

          {/* Workstation 2: คำนวณสารเคมี */}
          <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1A1F1C]">คำนวณปริมาณสารเคมี</h3>
              <p className="text-sm text-[#5A635D] leading-relaxed mt-2 mb-6">
                เลือกแมลงศัตรูพืชเป้าหมายและระบุขนาดพื้นที่แปลงนา เพื่อคำนวณอัตราการใช้สารเคมีที่แนะนำอย่างถูกต้อง ป้องกันการใช้ยาเกินขนาดและลดต้นทุน
              </p>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-[#E3E6E4]">
              <Link
                href="/member/calculation"
                className="flex-1 inline-flex items-center justify-center bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-4 rounded-md transition-colors"
              >
                <span>คำนวณสารเคมี</span>
              </Link>
              <Link
                href="/member/calculationresult"
                className="inline-flex items-center justify-center bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-4 rounded-md transition-colors"
              >
                <span>ผลล่าสุด</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}