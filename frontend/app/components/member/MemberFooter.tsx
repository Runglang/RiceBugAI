import Link from 'next/link';

export default function MemberFooter() {
  return (
    <footer className="w-full bg-[#163423] border-t border-[#25593A] py-6 text-[#DCEDE2] text-xs font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">

        {/* Left */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="font-bold text-white">RiceBug<span className="text-[#8CC2A1]">AI</span></span>
          <span className="text-[#3A8A5B] hidden sm:inline">—</span>
          <span className="text-[#B9DBC6] text-xs">ระบบสารสนเทศแมลงศัตรูพืชในนาข้าว</span>
        </div>

        {/* Center */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium">
          <Link href="/member/dashboard" className="text-[#DCEDE2] hover:text-white hover:underline transition-colors py-1">
            แดชบอร์ด
          </Link>
          <Link href="/member/analysisinsect" className="text-[#DCEDE2] hover:text-white hover:underline transition-colors py-1">
            วิเคราะห์แมลง
          </Link>
          <Link href="/member/calculation" className="text-[#DCEDE2] hover:text-white hover:underline transition-colors py-1">
            คำนวณเคมี
          </Link>
          <Link href="/member/listinsects" className="text-[#DCEDE2] hover:text-white hover:underline transition-colors py-1">
            ข้อมูลแมลง
          </Link>
          <Link href="/member/listchemicals" className="text-[#DCEDE2] hover:text-white hover:underline transition-colors py-1">
            ข้อมูลสารเคมี
          </Link>
        </div>

        {/* Right */}
        <div className="text-[#8CC2A1] text-xs shrink-0">
          © {new Date().getFullYear()} RiceBugAI
        </div>

      </div>
    </footer>
  );
}
