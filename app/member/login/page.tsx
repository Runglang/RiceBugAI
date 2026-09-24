'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

      const member = await res.json(); // { memberID, username, email, address }

      Cookies.set('member_session', JSON.stringify(member), { expires: 1 });

      router.push('/member/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-[540px]">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-10 py-12">

          {/* Header Icon */}
          <div className="flex justify-center mb-7">
            <div className="w-[78px] h-[78px] rounded-full bg-[#e7fce9] flex items-center justify-center">
              <Lock
                className="w-9 h-9 text-black"
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-[28px] font-bold text-slate-900">
              เข้าสู่ระบบสมาชิก
            </h1>

            <p className="mt-2 text-[16px] text-slate-400">
              เข้าถึงแดชบอร์ดตรวจจับศัตรูพืชด้วยระบบ AI ของคุณ
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-[17px] font-semibold text-slate-800 mb-2"
              >
                Username
              </label>

              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  strokeWidth={2}
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                  className="
                    w-full
                    h-[50px]
                    rounded-xl
                    border border-slate-200
                    bg-white
                    pl-12 pr-4
                    text-gray-900
                    placeholder:text-slate-400
                    outline-none
                    transition
                    focus:border-emerald-400
                    focus:ring-2
                    focus:ring-emerald-100
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-[17px] font-semibold text-slate-800 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <Key
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  strokeWidth={2}
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="
                    w-full
                    h-[50px]
                    rounded-xl
                    border border-slate-200
                    bg-white
                    pl-12 pr-12
                    text-gray-900
                    placeholder:text-slate-400
                    outline-none
                    transition
                    focus:border-emerald-400
                    focus:ring-2
                    focus:ring-emerald-100
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-slate-600
                    transition
                  "
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center mb-8">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="
                    w-5 h-5
                    rounded-md
                    border-slate-300
                    text-emerald-600
                    focus:ring-emerald-500
                  "
                />

                <span className="text-[16px] text-slate-500">
                  จดจำฉันไว้ในอุปกรณ์นี้
                </span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full
                h-[50px]
                rounded-xl
                bg-[#d1d5db]
                hover:bg-[#c7cbd1]
                text-[#173d22]
                font-bold
                text-[17px]
                transition
                disabled:opacity-60
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>

          </form>
          {/* Register Link */}
          <div className="text-center pt-2">
            <span className="text-sm text-slate-500">
              ยังไม่มีบัญชีใช่ไหม?{' '}
            </span>

            <Link
              href="/member/register"
              className="
                  text-sm
                  font-semibold
                  text-emerald-600
                  hover:text-emerald-700
                  transition
                "
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}