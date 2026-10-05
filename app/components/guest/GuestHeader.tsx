'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GuestHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-white border-b border-[#E3E6E4] font-sans">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">

        {/* Wordmark Only */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1A1F1C]">
            RiceBugAI
          </Link>

          {/* Navigation (Text Only) */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/insects"
              className={`px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${
                isActive('/insects')
                  ? 'bg-[#F1F3F2] text-[#1A1F1C] font-semibold'
                  : 'text-[#5A635D] hover:text-[#1A1F1C] hover:bg-[#F1F3F2]'
              }`}
            >
              แมลงศัตรูข้าว
            </Link>

            <Link
              href="/chemicals"
              className={`px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${
                isActive('/chemicals')
                  ? 'bg-[#F1F3F2] text-[#1A1F1C] font-semibold'
                  : 'text-[#5A635D] hover:text-[#1A1F1C] hover:bg-[#F1F3F2]'
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
            className="h-10 px-4 flex items-center rounded-md text-[15px] font-medium text-[#1A1F1C] hover:bg-[#F1F3F2] transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/member/register"
            className="h-10 px-4 flex items-center rounded-md bg-[#2D7048] hover:bg-[#25593A] active:bg-[#1E4730] text-white text-[15px] font-medium transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </div>

      </div>
    </header>
  );
}
