'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'ศูนย์ควบคุม',
    items: [
      {
        label: 'แดชบอร์ด',
        href: '/admin/dashboard',
      },
    ],
  },
  {
    title: 'จัดการข้อมูลแมลง',
    items: [
      {
        label: 'รายการแมลงทั้งหมด',
        href: '/admin/listadmininsects',
      },
      {
        label: 'เพิ่มแมลงใหม่',
        href: '/admin/addinsect',
      },
    ],
  },
  {
    title: 'จัดการข้อมูลสารเคมี',
    items: [
      {
        label: 'รายการสารเคมีทั้งหมด',
        href: '/admin/listadminchemicals',
      },
      {
        label: 'เพิ่มสารเคมีใหม่',
        href: '/admin/addchemical',
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    Cookies.remove('admin_session');
    router.push('/admin/login');
  };

  return (
    <aside className="w-[248px] min-h-screen bg-white text-[#3F4742] flex flex-col font-sans fixed top-0 left-0 bottom-0 z-40 border-r border-[#E3E6E4]">
      {/* Brand & Role */}
      <div className="p-5 border-b border-[#E3E6E4]">
        <div className="text-xl font-bold tracking-tight text-[#1A1F1C]">
          RiceBugAI
        </div>
        <div className="text-[13px] text-[#5A635D] font-normal mt-0.5">
          ผู้ดูแลระบบ
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            {/* Section Label */}
            <div className="text-[13px] font-semibold text-[#5A635D] px-3 mb-1.5">
              {section.title}
            </div>

            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center h-10 px-3 rounded-md text-[14px] font-medium transition-colors ${
                      active
                        ? 'bg-[#F0F7F2] text-[#1A1F1C] border-l-[3px] border-[#2D7048] font-semibold'
                        : 'text-[#5A635D] hover:bg-[#F1F3F2] hover:text-[#1A1F1C] border-l-[3px] border-transparent'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-[#E3E6E4]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-[#5A635D] hover:text-[#B42318] hover:bg-[#FDECEA] transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
