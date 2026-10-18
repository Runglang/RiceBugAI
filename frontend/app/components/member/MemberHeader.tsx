'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut, User } from 'lucide-react';

const navItems = [
  { label: 'แดชบอร์ด', href: '/member/dashboard' },
  { label: 'วิเคราะห์แมลง', href: '/member/analysisinsect' },
  { label: 'คำนวณเคมี', href: '/member/calculation' },
  { label: 'เพิ่มแปลงนา', href: '/member/addfield' },
  { label: 'ข้อมูลแมลง', href: '/member/listinsects' },
  { label: 'ข้อมูลสารเคมี', href: '/member/listchemicals' },
];

export default function MemberHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('member_session');
    router.push('/member/login');
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full h-14 bg-white/95 backdrop-blur-md border-b border-[#B9DBC6] font-sans shadow-[0_1px_3px_rgba(22,52,35,0.04)]">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">

        {/* Wordmark + Role Text */}
        <div className="flex items-center gap-6">
          <Link href="/member/dashboard" className="flex items-center gap-2 group">
            <span className="font-bold text-lg tracking-tight text-[#163423] group-hover:text-[#2D7048] transition-colors">
              RiceBug<span className="text-[#2D7048]">AI</span>
            </span>
            <span className="text-[12px] text-[#25593A] font-semibold px-2 py-0.5 rounded-full bg-[#E8F6ED] border border-[#B9DBC6]">
              สมาชิก
            </span>
          </Link>

          {/* Navigation (Text-driven) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-[13.5px] transition-all ${
                    active
                      ? 'bg-[#25593A] text-white font-semibold border border-[#1E4730] shadow-xs'
                      : 'text-[#2D3730] hover:text-[#163423] hover:bg-[#E8F6ED] font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/member/editprofile"
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-all ${
              isActive('/member/editprofile')
                ? 'bg-[#25593A] text-white font-semibold border-[#1E4730] shadow-xs'
                : 'bg-white text-[#2D3730] hover:text-[#163423] hover:bg-[#E8F6ED] border-[#B9DBC6]'
            }`}
          >
            <User size={14} className={isActive('/member/editprofile') ? 'text-white' : 'text-[#2D7048]'} />
            <span>โปรไฟล์</span>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A635D] hover:text-[#B42318] hover:bg-[#FDECEA] border border-transparent hover:border-[#F4B9B3] px-3 py-1.5 rounded-md transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
        </div>

      </div>
    </header>
  );
}
