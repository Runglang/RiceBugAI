'use client';

export default function AdminTopbar() {
  return (
    <header className="flex items-center justify-between px-6 bg-[#163423] border-b border-[#25593A] h-14 font-sans shrink-0 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">
          ระบบจัดการสารสนเทศแมลงศัตรูพืชและสารเคมีทางการเกษตร
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="bg-[#25593A] text-[#E8F6ED] text-xs font-semibold px-2.5 py-1 rounded-sm border border-[#3A8A5B]/50">
          ผู้ดูแลระบบ
        </span>
        <span className="text-xs text-[#8CC2A1] font-medium">
          เจ้าหน้าที่ระบบ
        </span>
      </div>
    </header>
  );
}
