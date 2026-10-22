'use client';

import { Menu } from 'lucide-react';

export interface AdminTopbarProps {
  onToggleSidebar?: () => void;
}

export default function AdminTopbar({ onToggleSidebar }: AdminTopbarProps) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 bg-[#163423] border-b border-[#25593A] h-14 font-sans shrink-0 shadow-xs gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="เปิดเมนูนำทาง"
          className="lg:hidden p-2 -ml-1 rounded-md text-[#DCEDE2] hover:text-white hover:bg-[#25593A] transition-colors cursor-pointer shrink-0"
        >
          <Menu size={20} />
        </button>

        <span className="text-sm font-semibold text-white truncate">
          ระบบจัดการสารสนเทศแมลงศัตรูพืชและสารเคมีทางการเกษตร
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="bg-[#25593A] text-[#E8F6ED] text-xs font-semibold px-2.5 py-1 rounded-sm border border-[#3A8A5B]/50">
          ผู้ดูแลระบบ
        </span>
        <span className="hidden sm:inline text-xs text-[#8CC2A1] font-medium">
          เจ้าหน้าที่ระบบ
        </span>
      </div>
    </header>
  );
}
