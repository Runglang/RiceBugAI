'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('กรุณายอมรับข้อกำหนดในการให้บริการ');
      return;
    }

    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/members/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, address }),
      });

      if (res.status === 409) {
        const data = await res.json();
        throw new Error(data.error || 'ข้อมูลผู้ใช้ซ้ำกรุณาลองใหม่อีกครั้ง');
      }

      if (!res.ok) {
        throw new Error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }

      setSuccess(true);

      // รอ 2 วินาทีแล้ว redirect ไปหน้า login
      setTimeout(() => {
        router.push('/member/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F5F1] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[540px]">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 px-10 py-12">

          {/* Header Title */}
          <div className="text-center mb-10">
            <h1 className="text-[28px] font-bold text-gray-900">
              Create an Account
            </h1>

            <p className="mt-2 text-[16px] text-gray-400">
              Please enter your details to register for access.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 text-center">
              สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-[17px] font-semibold text-gray-800 mb-2"
              >
                Username *
              </label>

              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                  disabled={isLoading || success}
                  className="
                    w-full
                    py-3
                    rounded-lg
                    border border-gray-300
                    bg-white
                    pl-12 pr-4
                    text-gray-900
                    placeholder:text-gray-400
                    outline-none
                    transition
                    focus:border-transparent
                    focus:ring-2
                    focus:ring-green-500
                    disabled:opacity-60
                  "
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-[17px] font-semibold text-gray-800 mb-2"
              >
                Email Address *
              </label>

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  strokeWidth={2}
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading || success}
                  className="
                    w-full
                    py-3
                    rounded-lg
                    border border-gray-300
                    bg-white
                    pl-12 pr-4
                    text-gray-900
                    placeholder:text-gray-400
                    outline-none
                    transition
                    focus:border-transparent
                    focus:ring-2
                    focus:ring-green-500
                    disabled:opacity-60
                  "
                />
              </div>
            </div>

            {/* Research Location / Address */}
            <div className="mb-6">
              <label
                htmlFor="address"
                className="block text-[17px] font-semibold text-gray-800 mb-2"
              >
                Research Location / Address *
              </label>

              <div className="relative">
                <MapPin
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  strokeWidth={2}
                />

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your research location"
                  required
                  disabled={isLoading || success}
                  className="
                    w-full
                    py-3
                    rounded-lg
                    border border-gray-300
                    bg-white
                    pl-12 pr-4
                    text-gray-900
                    placeholder:text-gray-400
                    outline-none
                    transition
                    focus:border-transparent
                    focus:ring-2
                    focus:ring-green-500
                    disabled:opacity-60
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-[17px] font-semibold text-gray-800 mb-2"
              >
                Password *
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                  disabled={isLoading || success}
                  className="
                    w-full
                    py-3
                    rounded-lg
                    border border-gray-300
                    bg-white
                    pl-12 pr-12
                    text-gray-900
                    placeholder:text-gray-400
                    outline-none
                    transition
                    focus:border-transparent
                    focus:ring-2
                    focus:ring-green-500
                    disabled:opacity-60
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                ต้องมีอย่างน้อย 8 ตัวอักษร
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className="flex items-start gap-2.5 text-left cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    acceptedTerms
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                >
                  {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                <span className="text-sm text-gray-500 leading-relaxed">
                  ฉันยอมรับข้อกำหนดในการให้บริการและนโยบายความเป็นส่วนตัว
                </span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="
                w-full
                py-3
                rounded-lg
                bg-green-500
                hover:bg-green-600
                text-white
                font-semibold
                shadow-[0_0_20px_rgba(34,197,94,0.4)]
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
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                'ลงทะเบียนบัญชี'
              )}
            </button>

          </form>

          {/* Footer Link to Login */}
          <div className="text-center pt-4">
            <span className="text-sm text-gray-500">
              มีบัญชีอยู่แล้วใช่ไหม?{' '}
            </span>

            <Link
              href="/member/login"
              className="text-sm font-semibold text-green-600 hover:text-green-700 transition"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
