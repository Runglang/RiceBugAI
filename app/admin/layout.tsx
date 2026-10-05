"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";

/** หน้าที่ไม่ต้องแสดง Sidebar/Topbar (ยังไม่ได้ login) */
const AUTH_PATHS = ["/admin/login"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ถ้าอยู่หน้า login → แสดงแค่ children เปล่าๆ ไม่มี sidebar/topbar
  if (AUTH_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#F7F8F7] font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ marginLeft: 248 }}>
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F7F8F7]">
          {children}
        </main>
      </div>
    </div>
  );
}
