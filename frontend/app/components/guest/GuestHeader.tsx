'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function GuestHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile menu on route change
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-[#163423] border-b border-[#25593A] font-sans shadow-sm">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">

        {/* Wordmark Only */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-[#DCEDE2] transition-colors">
            RiceBug<span className="text-[#8CC2A1]">AI</span>
          </Link>

          {/* Navigation (Desktop - sm and above) */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/insects"
              className={`px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${
                isActive('/insects')
                  ? 'bg-[#25593A] text-white font-semibold border border-[#3A8A5B]/40 shadow-xs'
                  : 'text-[#DCEDE2] hover:text-white hover:bg-[#25593A]/60'
              }`}
            >
              แมลงศัตรูข้าว
            </Link>

            <Link
              href="/chemicals"
              className={`px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${
                isActive('/chemicals')
                  ? 'bg-[#25593A] text-white font-semibold border border-[#3A8A5B]/40 shadow-xs'
                  : 'text-[#DCEDE2] hover:text-white hover:bg-[#25593A]/60'
              }`}
            >
              สารเคมี
            </Link>
          </nav>
        </div>

        {/* Auth Actions (Desktop - sm and above) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/member/login"
            className="h-10 px-4 flex items-center rounded-md text-[15px] font-medium text-[#DCEDE2] hover:text-white hover:bg-[#25593A]/60 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/member/register"
            className="h-10 px-4 flex items-center rounded-md bg-[#2D7048] hover:bg-[#3A8A5B] active:bg-[#25593A] text-white text-[15px] font-semibold border border-[#5BA478]/40 shadow-xs transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </div>

        {/* Mobile Header Actions (< sm) */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/member/login"
            className="h-9 px-3 flex items-center rounded-md text-xs font-semibold bg-[#25593A] text-white border border-[#3A8A5B]/50 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
            className="p-2 -mr-1 rounded-md text-[#DCEDE2] hover:text-white hover:bg-[#25593A] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (< sm) */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-[#163423] text-[#DCEDE2] h-full shadow-2xl flex flex-col font-sans border-l border-[#25593A] transition-transform duration-300 ease-in-out"
            aria-label="เมนูนำทางสำหรับผู้เยี่ยมชม"
          >
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-[#25593A] flex items-center justify-between bg-[#163423] shrink-0">
              <span className="font-bold text-lg text-white">
                RiceBug<span className="text-[#8CC2A1]">AI</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="ปิดเมนู"
                className="p-2 -mr-1 rounded-md text-[#DCEDE2] hover:text-white hover:bg-[#25593A] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <div className="text-xs font-semibold text-[#8CC2A1] px-3 py-1 uppercase tracking-wider">
                เมนูนำทาง
              </div>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center min-h-11 px-3.5 rounded-lg text-sm transition-all ${
                  pathname === '/'
                    ? 'bg-[#25593A] text-white font-semibold border border-[#3A8A5B]/40 shadow-xs'
                    : 'text-[#DCEDE2] hover:text-white hover:bg-[#25593A]/60 font-medium'
                }`}
              >
                <span>หน้าแรก</span>
              </Link>
              <Link
                href="/insects"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center min-h-11 px-3.5 rounded-lg text-sm transition-all ${
                  isActive('/insects')
                    ? 'bg-[#25593A] text-white font-semibold border border-[#3A8A5B]/40 shadow-xs'
                    : 'text-[#DCEDE2] hover:text-white hover:bg-[#25593A]/60 font-medium'
                }`}
              >
                <span>แมลงศัตรูข้าว</span>
              </Link>
              <Link
                href="/chemicals"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center min-h-11 px-3.5 rounded-lg text-sm transition-all ${
                  isActive('/chemicals')
                    ? 'bg-[#25593A] text-white font-semibold border border-[#3A8A5B]/40 shadow-xs'
                    : 'text-[#DCEDE2] hover:text-white hover:bg-[#25593A]/60 font-medium'
                }`}
              >
                <span>สารเคมีกำจัดศัตรูพืช</span>
              </Link>
            </nav>

            {/* Drawer Footer: Auth Actions */}
            <div className="p-4 border-t border-[#25593A] bg-[#122A1C] space-y-2 shrink-0">
              <Link
                href="/member/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-11 px-4 rounded-lg text-sm font-medium text-[#DCEDE2] hover:text-white hover:bg-[#25593A] border border-[#25593A] transition-all"
              >
                เข้าสู่ระบบสมาชิก
              </Link>

              <Link
                href="/member/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center min-h-11 px-4 rounded-lg bg-[#2D7048] hover:bg-[#3A8A5B] text-white text-sm font-semibold border border-[#5BA478]/40 shadow-xs transition-all"
              >
                สมัครสมาชิกใหม่
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
