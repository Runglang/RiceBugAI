import Link from 'next/link';

export default function GuestFooter() {
  return (
    <footer className="w-full bg-[#F7F8F7] border-t border-[#E3E6E4] py-10 text-[#5A635D] text-sm font-sans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-[#E3E6E4]">

          {/* Col 1: System Info */}
          <div className="md:col-span-2">
            <div className="text-base font-bold text-[#1A1F1C] mb-2">
              RiceBugAI
            </div>
            <p className="text-sm text-[#5A635D] max-w-sm leading-relaxed mb-3">
              ระบบสารสนเทศแมลงศัตรูพืชในนาข้าว บันทึกติดตามแปลงนาตามระยะการเติบโต และคำนวณปริมาณสารเคมีกำจัดแมลงตามหลักวิชาการ
            </p>
          </div>

          {/* Col 2: ฐานข้อมูล */}
          <div>
            <div className="font-semibold text-xs text-[#1A1F1C] uppercase tracking-wider mb-3">
              ฐานข้อมูลสาธารณะ
            </div>
            <ul className="space-y-2 text-sm text-[#5A635D]">
              <li>
                <Link href="/insects" className="hover:text-[#1A1F1C] hover:underline">
                  แมลงศัตรูข้าว
                </Link>
              </li>
              <li>
                <Link href="/chemicals" className="hover:text-[#1A1F1C] hover:underline">
                  สารเคมีกำจัดศัตรูพืช
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: บัญชีและระบบสมาชิก */}
          <div>
            <div className="font-semibold text-xs text-[#1A1F1C] uppercase tracking-wider mb-3">
              บริการสมาชิก
            </div>
            <ul className="space-y-2 text-sm text-[#5A635D]">
              <li>
                <Link href="/member/login" className="hover:text-[#1A1F1C] hover:underline">
                  เข้าสู่ระบบสมาชิก
                </Link>
              </li>
              <li>
                <Link href="/member/register" className="hover:text-[#1A1F1C] hover:underline">
                  สมัครสมาชิกใหม่
                </Link>
              </li>
              <li>
                <Link href="/member/dashboard" className="hover:text-[#1A1F1C] hover:underline">
                  แดชบอร์ดเกษตรกร
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[#5A635D] text-xs">
          <div>
            © {new Date().getFullYear()} RiceBugAI — ระบบสารสนเทศเพื่อการจัดการศัตรูข้าว
          </div>
          <div>
            <Link
              href="/admin/login"
              className="text-[#6B746E] hover:text-[#1A1F1C] hover:underline"
            >
              เข้าสู่ระบบสำหรับเจ้าหน้าที่ (Admin)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
