'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
const PASSWORD_REGEX = /^[a-zA-Z0-9!#_.]+$/;

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Username
    if (!username || username.trim() === '') {
      setError('กรุณากรอกชื่อผู้ใช้');
      return;
    }
    if (/\s/.test(username)) {
      setError('ชื่อผู้ใช้ต้องไม่มีช่องว่าง');
      return;
    }
    if (username.length < 3 || username.length > 12) {
      setError('ชื่อผู้ใช้ต้องมีความยาว 3-12 ตัวอักษร');
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setError('ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ (A-Z, a-z) หรือตัวเลข (0-9) เท่านั้น');
      return;
    }

    // Password
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }
    if (/\s/.test(password)) {
      setError('รหัสผ่านต้องไม่มีช่องว่าง');
      return;
    }
    if (password.length < 8 || password.length > 16) {
      setError('รหัสผ่านต้องมีความยาว 8-16 ตัวอักษร');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('รหัสผ่านต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข และอักขระพิเศษ (!, #, _, .) เท่านั้น');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/members/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      const member = await res.json();
      Cookies.set('member_session', JSON.stringify(member), { expires: 1 });
      router.push('/member/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F8F7] px-4 py-12 font-sans">
      <div className="bg-white p-8 rounded-lg w-full max-w-[400px] border border-[#E3E6E4]">

        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#5A635D] hover:text-[#1A1F1C] transition-colors font-medium cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>

        {/* Wordmark & Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-xl font-bold tracking-tight text-[#1A1F1C] mb-2">
            RiceBugAI
          </Link>
          <h1 className="text-xl font-bold text-[#1A1F1C]">
            เข้าสู่ระบบสมาชิก
          </h1>
          <p className="text-xs text-[#5A635D] mt-1">
            เข้าถึงระบบจัดการแปลงนาและเครื่องมือคำนวณสารเคมี
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-[#FDECEA] border border-[#F4B9B3] text-xs text-[#B42318] font-medium" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
            >
              ชื่อผู้ใช้
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={12}
              pattern="[a-zA-Z0-9]{3,12}"
              disabled={isLoading}
              className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
              placeholder="กรอกชื่อผู้ใช้"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
            >
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={16}
                pattern="[a-zA-Z0-9!#_.]{8,16}"
                disabled={isLoading}
                className="w-full h-10 pl-3 pr-10 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29D] hover:text-[#1A1F1C] cursor-pointer"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 rounded-md bg-[#2D7048] hover:bg-[#25593A] active:bg-[#1E4730] text-white text-sm font-medium transition-colors disabled:bg-[#F1F3F2] disabled:text-[#9AA29D] disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>กำลังตรวจสอบข้อมูล...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        <div className="text-center pt-5 mt-5 border-t border-[#E3E6E4] text-xs text-[#5A635D]">
          <span>ยังไม่มีบัญชีสมาชิก? </span>
          <Link
            href="/member/register"
            className="font-medium text-[#2D7048] hover:underline"
          >
            สมัครสมาชิกใหม่
          </Link>
        </div>

      </div>
    </div>
  );
}