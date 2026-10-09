"use client";

import { usePathname } from "next/navigation";
import MemberHeader from "../components/member/MemberHeader";
import MemberFooter from "../components/member/MemberFooter";

/** หน้าที่ไม่ต้องแสดง Header/Footer (ยังไม่ได้ login) */
const AUTH_PATHS = ["/member/login", "/member/register"];

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ถ้าอยู่หน้า login หรือ register → แสดงแค่ children เปล่าๆ
  if (AUTH_PATHS.includes(pathname)) {
    return <>{children}</>;
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
