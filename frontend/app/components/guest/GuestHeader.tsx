'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GuestHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-[#163423] border-b border-[#25593A] font-sans shadow-sm">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">

        {/* Wordmark Only */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-[#DCEDE2] transition-colors">
            RiceBug<span className="text-[#8CC2A1]">AI</span>
          </Link>

          {/* Navigation (Text Only) */}
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

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
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

      </div>
    </header>
  );
}
