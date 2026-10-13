'use client';

export default function AdminTopbar() {
  return (
    <header className="flex items-center justify-between px-6 bg-white border-b border-[#E3E6E4] h-14 font-sans shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#1A1F1C]">
          ระบบจัดการสารสนเทศแมลงศัตรูพืชและสารเคมีทางการเกษตร
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="bg-[#F1F3F2] text-[#3F4742] text-xs font-medium px-2.5 py-1 rounded-sm border border-[#E3E6E4]">
          ผู้ดูแลระบบ
        </span>
        <span className="text-xs text-[#5A635D]">
          เจ้าหน้าที่ระบบ
        </span>
      </div>
    </header>
  );
}
