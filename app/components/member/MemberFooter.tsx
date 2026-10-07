import Link from 'next/link';

export default function MemberFooter() {
  return (
    <footer className="w-full bg-[#F7F8F7] border-t border-[#E3E6E4] py-6 text-[#5A635D] text-xs font-sans">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1A1F1C]">RiceBugAI</span>
          <span>—</span>
          <span>ระบบสารสนเทศแมลงศัตรูพืชในนาข้าว</span>
        </div>

        {/* Center */}
        <div className="flex items-center gap-4 text-xs">
          <Link href="/member/dashboard" className="hover:text-[#1A1F1C] hover:underline">
            แดชบอร์ด
          </Link>
          <Link href="/member/listinsects" className="hover:text-[#1A1F1C] hover:underline">
            ข้อมูลแมลง
          </Link>
          <Link href="/member/listchemicals" className="hover:text-[#1A1F1C] hover:underline">
            คลังสารเคมี
          </Link>
          <Link href="/member/dashboard" className="hover:text-[#1A1F1C] hover:underline">
            แปลงนา
          </Link>
          <Link href="/member/calculation" className="hover:text-[#1A1F1C] hover:underline">
            คำนวณสารเคมี
          </Link>
        </div>

        {/* Right */}
        <div className="text-[#6B746E]">
          © {new Date().getFullYear()} RiceBugAI
        </div>

      </div>
    </footer>
  );
}
