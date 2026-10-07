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
    <header className="sticky top-0 z-50 w-full h-14 bg-white border-b border-[#E3E6E4] font-sans">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">

        {/* Wordmark + Role Text */}
        <div className="flex items-center gap-6">
          <Link href="/member/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-[#1A1F1C]">
              RiceBugAI
            </span>
            <span className="text-[13px] text-[#5A635D] font-normal pl-2 border-l border-[#E3E6E4]">
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
                  className={`px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors ${
                    active
                      ? 'bg-[#F1F3F2] text-[#1A1F1C] font-semibold'
                      : 'text-[#5A635D] hover:text-[#1A1F1C] hover:bg-[#F1F3F2]'
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
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              isActive('/member/editprofile')
                ? 'bg-[#F1F3F2] text-[#1A1F1C] font-semibold'
                : 'text-[#5A635D] hover:text-[#1A1F1C] hover:bg-[#F1F3F2]'
            }`}
          >
            <User size={14} />
            <span>โปรไฟล์</span>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A635D] hover:text-[#B42318] hover:bg-[#FDECEA] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
        </div>

      </div>
    </header>
  );
}
