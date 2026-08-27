"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AdminLogin() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/admins/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }

      const admin = await res.json(); // { adminID, email }

      Cookies.set("admin_session", JSON.stringify(admin), { expires: 1 });

      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">ผู้ดูแลระบบ</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          โปรดป้อนข้อมูลประจำตัวผู้ดูแลระบบของคุณเพื่อเข้าถึงแดชบอร์ดตรวจจับศัตรูพืช เฉพาะบุคลากรที่ได้รับอนุญาตเท่านั้น
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Admin ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black sm:text-sm outline-none transition-colors disabled:opacity-60"
                placeholder="กรอกอีเมลของคุณ"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black sm:text-sm outline-none transition-colors disabled:opacity-60"
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-700 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-700 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าถึงแดชบอร์ด"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}