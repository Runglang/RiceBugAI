import Link from 'next/link';

export default function GuestFooter() {
  return (
    <footer className="w-full bg-[#163423] border-t border-[#25593A] py-10 text-[#DCEDE2] text-sm font-sans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-[#25593A]">

          {/* Col 1: System Info */}
          <div className="md:col-span-2">
            <div className="text-base font-bold text-white mb-2">
              RiceBug<span className="text-[#8CC2A1]">AI</span>
            </div>
            <p className="text-sm text-[#B9DBC6] max-w-sm leading-relaxed mb-3">
              ระบบสารสนเทศแมลงศัตรูพืชในนาข้าว บันทึกติดตามแปลงนาตามระยะการเติบโต และคำนวณปริมาณสารเคมีกำจัดแมลงตามหลักวิชาการ
            </p>
          </div>

          {/* Col 2: ฐานข้อมูล */}
          <div>
            <div className="font-semibold text-xs text-[#8CC2A1] uppercase tracking-wider mb-3">
              ฐานข้อมูลสาธารณะ
            </div>
            <ul className="space-y-2 text-sm text-[#DCEDE2]">
              <li>
                <Link href="/insects" className="hover:text-white hover:underline transition-colors">
                  แมลงศัตรูข้าว
                </Link>
              </li>
              <li>
                <Link href="/chemicals" className="hover:text-white hover:underline transition-colors">
                  สารเคมีกำจัดศัตรูพืช
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: บัญชีและระบบสมาชิก */}
          <div>
            <div className="font-semibold text-xs text-[#8CC2A1] uppercase tracking-wider mb-3">
              บริการสมาชิก
            </div>
            <ul className="space-y-2 text-sm text-[#DCEDE2]">
              <li>
                <Link href="/member/login" className="hover:text-white hover:underline transition-colors">
                  เข้าสู่ระบบสมาชิก
                </Link>
              </li>
              <li>
                <Link href="/member/register" className="hover:text-white hover:underline transition-colors">
                  สมัครสมาชิกใหม่
                </Link>
              </li>
              <li>
                <Link href="/member/dashboard" className="hover:text-white hover:underline transition-colors">
                  แดชบอร์ดเกษตรกร
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[#8CC2A1] text-xs">
          <div>
            © {new Date().getFullYear()} RiceBugAI — ระบบสารสนเทศเพื่อการจัดการศัตรูข้าว
          </div>
          <div>
            <Link
              href="/admin/login"
              className="text-[#B9DBC6] hover:text-white hover:underline transition-colors"
            >
              เข้าสู่ระบบสำหรับเจ้าหน้าที่ (Admin)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
