'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: 'แดชบอร์ด',
    href: '/admin/dashboard',
  },
  {
    label: 'รายการแมลงทั้งหมด',
    href: '/admin/listadmininsects',
  },
  {
    label: 'เพิ่มแมลงใหม่',
    href: '/admin/addinsect',
  },
  {
    label: 'รายการสารเคมีทั้งหมด',
    href: '/admin/listadminchemicals',
  },
  {
    label: 'เพิ่มสารเคมีใหม่',
    href: '/admin/addchemical',
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
    <aside className="w-[248px] min-h-screen bg-[#163423] text-[#DCEDE2] flex flex-col font-sans fixed top-0 left-0 bottom-0 z-40 border-r border-[#25593A] shadow-md">
      {/* Brand & Role */}
      <div className="p-5 border-b border-[#25593A]">
        <div className="text-xl font-bold tracking-tight text-white">
          RiceBug<span className="text-[#8CC2A1]">AI</span>
        </div>
        <div className="text-[13px] text-[#8CC2A1] font-medium mt-0.5">
          ผู้ดูแลระบบ
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center h-10 px-3 rounded-md text-[14px] font-medium transition-colors ${
                active
                  ? 'bg-[#25593A] text-white border-l-[3px] border-[#8CC2A1] font-semibold shadow-xs'
                  : 'text-[#DCEDE2] hover:bg-[#1E4730] hover:text-white border-l-[3px] border-transparent'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-[#25593A]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs font-medium text-[#DCEDE2] hover:text-white hover:bg-[#B42318]/30 border border-transparent hover:border-[#F4B9B3]/30 transition-colors cursor-pointer"
        >
          <LogOut size={14} className="text-[#8CC2A1]" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
