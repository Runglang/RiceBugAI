'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ---------- Validation ตาม SRS ----------
const EMAIL_MAX = 60;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 16;

// รูปแบบอีเมล: ตัวอักษรอังกฤษ ตัวเลข และอักขระที่ใช้ในอีเมลได้ (. _ % + -)
const EMAIL_REGEX =
  /^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

// รหัสผ่าน: A-Z, a-z, 0-9 และอักขระพิเศษ ! # _ . เท่านั้น
const PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9!#_.]+$/;

function validateLoginForm(email: string, password: string): string[] {
  const errors: string[] = [];

  // อีเมล (ตรวจค่าที่ผู้ใช้กรอกจริง ไม่ trim)
  if (email === '') {
    errors.push('อีเมล: กรุณากรอกอีเมล');
  } else if (/\s/.test(email)) {
    errors.push('อีเมล: ห้ามมีช่องว่าง');
  } else if (email.length > EMAIL_MAX) {
    errors.push(`อีเมล: ต้องมีความยาวไม่เกิน ${EMAIL_MAX} ตัวอักษร`);
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('อีเมล: รูปแบบอีเมลไม่ถูกต้อง (ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และอักขระที่ถูกต้องตามรูปแบบอีเมล)');
  }

  // รหัสผ่าน (ตรวจค่าที่ผู้ใช้กรอกจริง ไม่ trim)
  if (password === '') {
    errors.push('รหัสผ่าน: กรุณากรอกรหัสผ่าน');
  } else if (/\s/.test(password)) {
    errors.push('รหัสผ่าน: ห้ามมีช่องว่าง');
  } else if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.push(`รหัสผ่าน: ต้องมีความยาว ${PASSWORD_MIN}-${PASSWORD_MAX} ตัวอักษร`);
  } else if (!PASSWORD_ALLOWED_REGEX.test(password)) {
    errors.push('รหัสผ่าน: ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ A-Z, a-z ตัวเลข 0-9 และอักขระพิเศษ ! # _ . เท่านั้น');
  }

  return errors;
}

export default function AdminLogin() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateLoginForm(email, password);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' / '));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/admins/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      const admin = await res.json(); // { adminID, email }

      Cookies.set('admin_session', JSON.stringify(admin), { expires: 1 });

      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F8F7] px-4 py-12 font-sans">
      <div className="bg-white p-8 sm:p-10 rounded-lg w-full max-w-md border border-[#E3E6E4]">

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

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight text-[#1A1F1C] mb-1">
            RiceBugAI
          </div>
          <div className="text-xs text-[#5A635D] font-medium mb-3">
            ระบบจัดการสำหรับเจ้าหน้าที่
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1A1F1C]">
            เข้าสู่ระบบผู้ดูแล
          </h1>
          <p className="text-xs text-[#5A635D] mt-1">
            เข้าถึงศูนย์ควบคุมและจัดการฐานข้อมูลสารสนเทศการเกษตร
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-md bg-[#FDECEA] border border-[#F4B9B3] text-xs text-[#B42318] font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#1A1F1C] mb-1.5"
            >
              อีเมลผู้ดูแลระบบ (Admin Email)
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA29D]" />
              <input
                id="email"
                name="email"
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:opacity-60"
                placeholder="admin@ricebugai.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#1A1F1C] mb-1.5"
            >
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA29D]" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-10 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:opacity-60"
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA29D] hover:text-[#1A1F1C] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 h-10 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-xs font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบผู้ดูแล</span>
            )}
          </button>
        </form>

        <div className="text-center pt-6 mt-6 border-t border-[#E3E6E4] text-xs text-[#5A635D]">
          <span>เป็นสมาชิกทั่วไป? </span>
          <Link
            href="/member/login"
            className="font-semibold text-[#2D7048] hover:text-[#25593A]"
          >
            เข้าสู่ระบบสมาชิก
          </Link>
        </div>

      </div>
    </div>
  );
}