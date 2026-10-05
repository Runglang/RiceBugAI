'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Calculator,
  AlertTriangle,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CalculationResultDTO {
  calculationID: string;
  calculateDate: string;
  areaSize: number;
  areaUnit: string;
  calculatedAmount: number;
  amountUnit: string;
  waterPerRai: number | null;
  insect: { insectID: string; insectName: string };
  chemical: {
    chemicalID: string;
    chemicalName: string;
    dosageRate: number;
    dosageUnit: string;
    usageMethod: string;
  };
}

const USAGE_LABEL: Record<string, string> = {
  foliar_spray: 'พ่นทางใบ',
  broadcast: 'หว่าน/โรยเม็ด',
};

const USAGE_DESCRIPTION: Record<string, string> = {
  foliar_spray: 'ผสมสารเคมีกับน้ำตามสัดส่วนที่ระบุ แล้วฉีดพ่นให้ทั่วแปลงนาข้าว',
  broadcast: 'หว่านหรือโรยเม็ดสารเคมีลงในแปลงนาให้กระจายสม่ำเสมอ',
};

export default function CalculationResultPage() {
  const router = useRouter();
  const [results, setResults] = useState<CalculationResultDTO[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = sessionStorage.getItem('calculation_results');
        if (stored) {
          const parsed: CalculationResultDTO[] = JSON.parse(stored);
          setResults(parsed);
        }
      } catch {
        setResults(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
        <span>กำลังประมวลผลสรุปปริมาณสารเคมี...</span>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E3E6E4] rounded-lg text-center flex flex-col items-center gap-3 font-sans">
        <h3 className="text-base font-bold text-[#1A1F1C]">ไม่พบข้อมูลผลการคำนวณ</h3>
        <p className="text-sm text-[#5A635D]">
          กรุณาระบุชนิดศัตรูพืชและขนาดพื้นที่ในแบบฟอร์มคำนวณก่อน
        </p>
        <button
          onClick={() => router.push('/member/calculation')}
          className="mt-2 inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium text-white bg-[#2D7048] rounded-md hover:bg-[#25593A] transition-colors cursor-pointer"
        >
          <Calculator size={16} />
          <span>ไปที่เครื่องมือคำนวณ</span>
        </button>
      </div>
    );
  }

  const first = results[0];
  const calcDate = new Date(first.calculateDate);
  const dateStr = calcDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = calcDate.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-4xl mx-auto px-6 pt-8">

        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E3E6E4]">
          <div className="flex items-center gap-2 text-sm text-[#5A635D]">
            <Link href="/member/dashboard" className="hover:text-[#1A1F1C] transition-colors">แดชบอร์ด</Link>
            <span>/</span>
            <Link href="/member/calculation" className="hover:text-[#1A1F1C] transition-colors">คำนวณสารเคมี</Link>
            <span>/</span>
            <span className="text-[#1A1F1C] font-semibold">ผลการคำนวณ</span>
          </div>

          <button
            onClick={() => router.push('/member/calculation')}
            className="inline-flex items-center gap-1 text-sm text-[#5A635D] hover:text-[#1A1F1C] transition-colors font-medium cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>คำนวณใหม่</span>
          </button>
        </div>

        {/* Summary Matrix Strip */}
        <div className="bg-white border border-[#E3E6E4] rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between text-xs text-[#5A635D] mb-3 pb-3 border-b border-[#E3E6E4]">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#9AA29D]" />
              <span>คำนวณเมื่อ: {dateStr} เวลา {timeStr} น.</span>
            </div>
            <span className="text-xs text-[#2D7048] font-medium">สรุปคำแนะนำการใช้งาน</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
              <div className="text-xs text-[#5A635D]">แมลงเป้าหมาย</div>
              <div className="text-base font-bold text-[#1A1F1C] mt-0.5">{first.insect.insectName}</div>
            </div>

            <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
              <div className="text-xs text-[#5A635D]">ขนาดพื้นที่ระบาด</div>
              <div className="text-base font-bold text-[#1A1F1C] mt-0.5">{first.areaSize} {first.areaUnit}</div>
            </div>

            <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
              <div className="text-xs text-[#5A635D]">ปริมาณน้ำที่ใช้ผสม</div>
              <div className="text-base font-bold text-[#1A1F1C] mt-0.5">
                {first.waterPerRai != null ? `${first.waterPerRai} ลิตร/ไร่` : 'ตามฉลากแนะนำ'}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Formulations Heading */}
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#1A1F1C]">
            สูตรสารเคมีที่แนะนำสำหรับกำจัด ({results.length} รายการ)
          </h2>
        </div>

        {/* Chemical Cards */}
        <div className="space-y-4 mb-8">
          {results.map((r) => (
            <div
              key={r.calculationID || r.chemical.chemicalID}
              className="bg-white border border-[#E3E6E4] rounded-lg overflow-hidden"
            >
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-sm bg-[#F1F3F2] text-[#3F4742] border border-[#E3E6E4] font-medium">
                      {USAGE_LABEL[r.chemical.usageMethod] ?? r.chemical.usageMethod}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1A1F1C]">
                    {r.chemical.chemicalName}
                  </h3>
                  <p className="text-xs text-[#5A635D] mt-0.5">
                    อัตราใช้มาตรฐาน: {r.chemical.dosageRate} {r.chemical.dosageUnit}
                  </p>
                </div>

                {/* Calculated Dosage */}
                <div className="bg-[#F0F7F2] border border-[#B9DBC6] rounded-md p-3.5 text-right shrink-0 min-w-36">
                  <div className="text-xs text-[#5A635D] font-medium">ปริมาณที่ต้องใช้รวม</div>
                  <div className="text-2xl font-bold text-[#2D7048] leading-tight mt-0.5">
                    {r.calculatedAmount}
                  </div>
                  <div className="text-xs text-[#25593A] font-medium">{r.amountUnit}</div>
                </div>
              </div>

              {/* Hint Strip */}
              <div className="px-5 py-3 bg-[#F7F8F7] border-t border-[#E3E6E4] text-xs text-[#5A635D] flex items-center justify-between flex-wrap gap-2">
                <span>{USAGE_DESCRIPTION[r.chemical.usageMethod] ?? 'ปฏิบัติตามคำแนะนำบนฉลาก'}</span>
                <Link
                  href={`/member/viewchemical?id=${r.chemical.chemicalID}`}
                  className="text-[#2D7048] hover:text-[#25593A] font-medium inline-flex items-center gap-1"
                >
                  <span>ดูรายละเอียดสารเคมี</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Safety Alert */}
        <div className="p-4 bg-[#FFF4E0] border border-[#F0D29A] rounded-lg flex items-start gap-3 text-xs text-[#8A5300] mb-8">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#8A5300]" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-[#8A5300]">คำแนะนำด้านความปลอดภัย:</strong> โปรดสวมใส่อุปกรณ์ป้องกันร่างกาย (PPE) เช่น ถุงมือยางและหน้ากากอนามัยขณะผสมและฉีดพ่น และไม่ควรฉีดพ่นในช่วงที่ลมแรงหรือก่อนฝนตก
          </p>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E6E4]">
          <Link
            href="/member/dashboard"
            className="h-10 px-4 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium rounded-md transition-colors cursor-pointer inline-flex items-center"
          >
            กลับแดชบอร์ด
          </Link>
          <Link
            href="/member/calculation"
            className="h-10 px-5 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium rounded-md transition-colors cursor-pointer inline-flex items-center"
          >
            คำนวณแปลงใหม่
          </Link>
        </div>

      </div>
    </div>
  );
}
