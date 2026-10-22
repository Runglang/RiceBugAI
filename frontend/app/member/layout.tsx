"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import MemberHeader from "../components/member/MemberHeader";
import MemberFooter from "../components/member/MemberFooter";

/** หน้าที่ไม่ต้องแสดง Header/Footer (ยังไม่ได้ login) */
const AUTH_PATHS = ["/member/login", "/member/register"];

type AuthStatus = "checking" | "authorized" | "unauthorized";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [prevPathname, setPrevPathname] = useState<string>(pathname);

  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // เมื่อเปลี่ยนหน้าให้รีเซ็ตสถานะเป็น checking ทันที เพื่อป้องกันสถานะ authorized เดิมค้าง
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
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

      const session = Cookies.get("member_session");
      if (!session) {
        setAuthStatus("unauthorized");
        router.replace("/member/login");
        return;
      }

      try {
        const parsed = JSON.parse(session);
        if (!parsed || (typeof parsed === "object" && Object.keys(parsed).length === 0)) {
          setAuthStatus("unauthorized");
          router.replace("/member/login");
          return;
        }
        setAuthStatus("authorized");
      } catch {
        setAuthStatus("unauthorized");
        router.replace("/member/login");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthPath, pathname, router]);

  // ถ้าอยู่หน้า login หรือ register → แสดงแค่ children เปล่าๆ
  if (isAuthPath) {
    return <>{children}</>;
  }

  // ป้องกันการแสดงเนื้อหาหน้าส่วนตัวก่อนตรวจ Session เสร็จ หรือเมื่อไม่ได้รับอนุญาต
  if (authStatus !== "authorized") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] font-sans">
      <MemberHeader />
      <main className="flex-1">
        {children}
      </main>
      <MemberFooter />
    </div>
  );
}
