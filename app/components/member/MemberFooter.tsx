import Link from 'next/link';

export default function MemberFooter() {
  return (
    <footer className="w-full bg-[#F8FAF8] border-t border-[#E1E6E2] py-6 text-[#65716A] text-xs font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#111813]">RiceBug<span className="text-[#2D7048]">AI</span></span>
          <span className="text-[#CBD3CE]">—</span>
          <span>ระบบสารสนเทศแมลงศัตรูพืชในนาข้าว</span>
        </div>

        {/* Center */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/member/dashboard" className="text-[#4B5750] hover:text-[#2D7048] transition-colors">
            แดชบอร์ด
          </Link>
          <Link href="/member/analysisinsect" className="text-[#4B5750] hover:text-[#2D7048] transition-colors">
            วิเคราะห์แมลง
          </Link>
          <Link href="/member/calculation" className="text-[#4B5750] hover:text-[#2D7048] transition-colors">
            คำนวณเคมี
          </Link>
          <Link href="/member/listinsects" className="text-[#4B5750] hover:text-[#2D7048] transition-colors">
            ข้อมูลแมลง
          </Link>
          <Link href="/member/listchemicals" className="text-[#4B5750] hover:text-[#2D7048] transition-colors">
            ข้อมูลสารเคมี
          </Link>
        </div>

        {/* Right */}
        <div className="text-[#939E97]">
          © {new Date().getFullYear()} RiceBugAI
        </div>

      </div>
    </footer>
  );
}
