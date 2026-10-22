'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut, User, Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile menu on route change
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const handleLogout = () => {
    setMobileMenuOpen(false);
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

          {/* Navigation (Desktop - lg and above) */}
          <nav className="hidden lg:flex items-center gap-1">
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

        {/* Right side (Desktop - lg and above) */}
        <div className="hidden lg:flex items-center gap-2">
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
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A635D] hover:text-[#B42318] hover:bg-[#FDECEA] border border-transparent hover:border-[#F4B9B3] px-3 py-1.5 rounded-md transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
        </div>

        {/* Mobile Actions (< lg: Tablet & Mobile) */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/member/editprofile"
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all ${
              isActive('/member/editprofile')
                ? 'bg-[#25593A] text-white font-semibold border-[#1E4730]'
                : 'bg-white text-[#2D3730] hover:bg-[#E8F6ED] border-[#B9DBC6]'
            }`}
            aria-label="โปรไฟล์ของฉัน"
          >
            <User size={15} className={isActive('/member/editprofile') ? 'text-white' : 'text-[#2D7048]'} />
            <span className="hidden sm:inline">โปรไฟล์</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
            className="p-2 -mr-1 rounded-md text-[#2D3730] hover:text-[#163423] hover:bg-[#E8F6ED] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Off-canvas Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col font-sans transition-transform duration-300 ease-in-out"
            aria-label="เมนูนำทางสำหรับสมาชิก"
          >
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-[#B9DBC6] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#163423]">
                  RiceBug<span className="text-[#2D7048]">AI</span>
                </span>
                <span className="text-[11px] text-[#25593A] font-semibold px-2 py-0.5 rounded-full bg-[#E8F6ED] border border-[#B9DBC6]">
                  สมาชิก
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="ปิดเมนู"
                className="p-2 -mr-1 rounded-md text-[#5A635D] hover:text-[#163423] hover:bg-[#E8F6ED] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <div className="text-xs font-semibold text-[#5BA478] px-3 py-1 uppercase tracking-wider">
                เมนูหลัก
              </div>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center min-h-11 px-3.5 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-[#25593A] text-white font-semibold border border-[#1E4730] shadow-xs'
                        : 'text-[#2D3730] hover:text-[#163423] hover:bg-[#E8F6ED] font-medium'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer: Profile & Logout */}
            <div className="p-4 border-t border-[#B9DBC6]/40 bg-[#F8FAF8] space-y-2 shrink-0">
              <Link
                href="/member/editprofile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 min-h-11 px-3.5 rounded-lg text-sm font-medium border transition-all ${
                  isActive('/member/editprofile')
                    ? 'bg-[#25593A] text-white font-semibold border-[#1E4730] shadow-xs'
                    : 'bg-white text-[#2D3730] hover:bg-[#E8F6ED] border-[#B9DBC6]'
                }`}
              >
                <User size={16} className={isActive('/member/editprofile') ? 'text-white' : 'text-[#2D7048]'} />
                <span>โปรไฟล์ของฉัน</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full min-h-11 px-3.5 rounded-lg text-sm font-medium text-[#B42318] hover:bg-[#FDECEA] border border-transparent hover:border-[#F4B9B3] transition-all cursor-pointer"
              >
                <LogOut size={16} />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
