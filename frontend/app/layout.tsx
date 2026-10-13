import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/shared/ToastContext";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans-thai",
});

export const metadata: Metadata = {
  title: "RiceBugAI — ระบบสารสนเทศแมลงศัตรูพืชในนาข้าว",
  description: "ระบบจำแนกชนิดแมลงศัตรูข้าว ติดตามระยะการเจริญเติบโต และคำนวณปริมาณสารเคมีกำจัดแมลงตามหลักวิชาการเกษตร",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${ibmPlexSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#3F4742] font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
