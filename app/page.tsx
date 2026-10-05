import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GuestHeader from './components/guest/GuestHeader';
import GuestFooter from './components/guest/GuestFooter';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#3F4742] font-sans">
      <GuestHeader />

      <main className="flex-1">

        {/* 1. Hero Section (Clean, Official, Direct) */}
        <section className="py-16 md:py-20 px-6 border-b border-[#E3E6E4] bg-white">
          <div className="max-w-4xl mx-auto text-center">

            <div className="text-sm font-semibold text-[#2D7048] mb-3">
              ระบบสารสนเทศเพื่อการจัดการแมลงศัตรูพืชในนาข้าว
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#1A1F1C] leading-tight mb-5">
              ระบบวินิจฉัยและจัดการแมลงศัตรูข้าว
            </h1>

            <p className="text-base sm:text-lg text-[#5A635D] max-w-2xl mx-auto mb-8 leading-relaxed">
              ฐานข้อมูลสัณฐานวิทยาของแมลงศัตรูข้าว บันทึกติดตามแปลงนาตามระยะการเติบโต
              และคำนวณปริมาณสารเคมีกำจัดแมลงที่เหมาะสมตามหลักวิชาการ
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/insects"
                className="w-full sm:w-auto h-11 px-6 flex items-center justify-center gap-2 bg-[#2D7048] hover:bg-[#25593A] active:bg-[#1E4730] text-white text-[15px] font-medium rounded-md transition-colors"
              >
                <span>ดูข้อมูลแมลงศัตรูข้าว</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/chemicals"
                className="w-full sm:w-auto h-11 px-6 flex items-center justify-center gap-2 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-[15px] font-medium rounded-md transition-colors"
              >
                <span>ดูข้อมูลสารเคมี</span>
              </Link>
            </div>

          </div>
        </section>

        {/* 2. Public Database Access (Guest Catalog Entrances) */}
        <section className="py-14 px-6 border-b border-[#E3E6E4] bg-white">
          <div className="max-w-5xl mx-auto">

            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1F1C]">
                ฐานข้อมูลสาธารณะ
              </h2>
              <p className="text-sm text-[#5A635D] mt-1">
                สืบค้นข้อมูลแมลงศัตรูพืชในนาข้าวและสารเคมีป้องกันกำจัด
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Insect Catalog Entry */}
              <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1F1C]">
                    แมลงศัตรูข้าว
                  </h3>
                  <p className="text-sm text-[#5A635D] leading-relaxed mt-2 mb-6">
                    รวบรวมข้อมูลแมลงศัตรูข้าวสำคัญ เช่น เพลี้ยกระโดดสีน้ำตาล หนอนกอข้าว เพลี้ยไฟ และหนอนห่อใบข้าว พร้อมจำแนกตามลักษณะการทำลายและระยะการเติบโตของข้าว
                  </p>
                </div>

                <Link
                  href="/insects"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-4 rounded-md transition-colors"
                >
                  <span>เปิดดูข้อมูลแมลง</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Chemical Catalog Entry */}
              <div className="bg-white border border-[#E3E6E4] rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1F1C]">
                    สารเคมีป้องกันกำจัด
                  </h3>
                  <p className="text-sm text-[#5A635D] leading-relaxed mt-2 mb-6">
                    ฐานข้อมูลสารเคมีป้องกันและกำจัดแมลงศัตรูข้าว ชื่อสารออกฤทธิ์ คุณสมบัติการดูดซึม อัตราการใช้มาตรฐาน และคำเตือนความปลอดภัยตามข้อกำหนด
                  </p>
                </div>

                <Link
                  href="/chemicals"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium h-10 px-4 rounded-md transition-colors"
                >
                  <span>เปิดดูข้อมูลสารเคมี</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

            </div>

          </div>
        </section>

        {/* 3. Member Services Section */}
        <section className="py-14 px-6 bg-[#F7F8F7]">
          <div className="max-w-5xl mx-auto">

            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1F1C]">
                บริการสำหรับสมาชิก
              </h2>
              <p className="text-sm text-[#5A635D] mt-1">
                ระบบจัดการแปลงนาและเครื่องมือคำนวณปริมาณสารเคมีรายแปลง
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

              <div className="bg-white border border-[#E3E6E4] rounded-lg p-6">
                <h4 className="text-base font-bold text-[#1A1F1C]">บันทึกข้อมูลแปลงนา</h4>
                <p className="text-sm text-[#5A635D] leading-relaxed mt-2">
                  ลงทะเบียนแปลงนา ขนาดพื้นที่ (ไร่/งาน/ตารางวา) และวันที่เริ่มปลูกข้าวเพื่อติดตามดูแล
                </p>
              </div>

              <div className="bg-white border border-[#E3E6E4] rounded-lg p-6">
                <h4 className="text-base font-bold text-[#1A1F1C]">ติดตามระยะการเติบโต</h4>
                <p className="text-sm text-[#5A635D] leading-relaxed mt-2">
                  ระบบคำนวณอายุข้าวและประเมินระยะการเจริญเติบโตเพื่อเฝ้าระวังแมลงศัตรูพืชตามช่วงเวลา
                </p>
              </div>

              <div className="bg-white border border-[#E3E6E4] rounded-lg p-6">
                <h4 className="text-base font-bold text-[#1A1F1C]">คำนวณสารเคมีแม่นยำ</h4>
                <p className="text-sm text-[#5A635D] leading-relaxed mt-2">
                  คำนวณปริมาณสารเคมีและอัตราผสมน้ำตามขนาดแปลงนาจริง ช่วยประหยัดและปลอดภัย
                </p>
              </div>

            </div>

            <div>
              <Link
                href="/member/register"
                className="inline-flex items-center gap-2 bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium h-10 px-5 rounded-md transition-colors"
              >
                <span>สมัครสมาชิกเพื่อใช้งาน</span>
                <ArrowRight size={15} />
              </Link>
            </div>

          </div>
        </section>

      </main>

      <GuestFooter />
    </div>
  );
}