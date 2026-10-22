"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";

/** หน้าที่ไม่ต้องแสดง Sidebar/Topbar (ยังไม่ได้ login) */
const AUTH_PATHS = ["/admin/login"];

type AuthStatus = "checking" | "authorized" | "unauthorized";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [prevPathname, setPrevPathname] = useState<string>(pathname);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // เมื่อเปลี่ยนหน้าให้รีเซ็ตสถานะเป็น checking ทันที เพื่อป้องกันสถานะ authorized เดิมค้าง และปิด mobile sidebar
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileSidebarOpen(false);
    if (!isAuthPath) {
      setAuthStatus("checking");
    }
  }

  useEffect(() => {
    if (isAuthPath) {
      return;
    }

    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) return;

      const session = Cookies.get("admin_session");
      if (!session) {
        setAuthStatus("unauthorized");
        router.replace("/admin/login");
        return;
      }

      try {
        const parsed = JSON.parse(session);
        if (!parsed || (typeof parsed === "object" && Object.keys(parsed).length === 0)) {
          setAuthStatus("unauthorized");
          router.replace("/admin/login");
          return;
        }
        setAuthStatus("authorized");
      } catch {
        setAuthStatus("unauthorized");
        router.replace("/admin/login");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthPath, pathname, router]);

  // ถ้าอยู่หน้า login → แสดงแค่ children เปล่าๆ ไม่มี sidebar/topbar
  if (isAuthPath) {
    return <>{children}</>;
  }

  // ป้องกันการแสดงเนื้อหาหน้าส่วนตัวก่อนตรวจ Session เสร็จ หรือเมื่อไม่ได้รับอนุญาต
  if (authStatus !== "authorized") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F7]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F8F7] font-sans overflow-hidden">
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-62">
        <AdminTopbar
          onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F7F8F7]">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
