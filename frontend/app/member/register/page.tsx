'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
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
        body: JSON.stringify({
          username,
          firstname: firstname.trim() || null,
          lastname: lastname.trim() || null,
          password,
          email,
          address,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        throw new Error(data.error || 'ข้อมูลผู้ใช้ซ้ำ กรุณาลองใหม่อีกครั้ง');
      }

      if (!res.ok) {
        throw new Error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/member/login');
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-[#F7F8F7] px-4 py-12 font-sans">
      <div className="bg-white p-8 rounded-lg w-full max-w-md border border-[#E3E6E4]">

        {/* Wordmark & Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-xl font-bold tracking-tight text-[#1A1F1C] mb-2">
            RiceBugAI
          </Link>
          <h1 className="text-xl font-bold text-[#1A1F1C]">
            สมัครสมาชิกใหม่
          </h1>
          <p className="text-xs text-[#5A635D] mt-1">
            กรอกข้อมูลเพื่อสร้างบัญชีสำหรับจัดการแปลงนาและคำนวณสารเคมี
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-md bg-[#E8F5EC] border border-[#B7DFC6] text-xs text-[#1E7B45] text-center font-medium" role="status">
            สมัครสมาชิกสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-md bg-[#FDECEA] border border-[#F4B9B3] text-xs text-[#B42318] font-medium" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
            >
              ชื่อผู้ใช้ (Username) <span className="text-xs text-[#5A635D] font-normal">(จำเป็น)</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading || success}
              className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
              placeholder="ระบุชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
            />
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstname"
                className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
              >
                ชื่อจริง
              </label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                disabled={isLoading || success}
                className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
                placeholder="ชื่อจริง"
              />
            </div>
            <div>
              <label
                htmlFor="lastname"
                className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
              >
                นามสกุล
              </label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                disabled={isLoading || success}
                className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
                placeholder="นามสกุล"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
            >
              อีเมล <span className="text-xs text-[#5A635D] font-normal">(จำเป็น)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || success}
              className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
              placeholder="example@domain.com"
            />
          </div>

          {/* Address / Location */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
            >
              ที่อยู่ / ที่ตั้งแปลงเพาะปลูก <span className="text-xs text-[#5A635D] font-normal">(จำเป็น)</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              disabled={isLoading || success}
              className="w-full h-10 px-3 bg-white border border-[#CDD2CF] rounded-md text-[15px] text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-2 focus:ring-[#B9DBC6] disabled:bg-[#F1F3F2]"
              placeholder="ตำบล อำเภอ จังหวัด"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1A1F1C] mb-1.5"
            >
              รหัสผ่าน <span className="text-xs text-[#5A635D] font-normal">(อย่างน้อย 8 ตัวอักษร)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || success}
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

          {/* Terms Checkbox */}
          <button
            type="button"
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className="flex items-start gap-2.5 text-left cursor-pointer group pt-1"
          >
            <div
              className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                acceptedTerms
                  ? 'bg-[#2D7048] border-[#2D7048]'
                  : 'border-[#CDD2CF] group-hover:border-[#9AA29D] bg-white'
              }`}
            >
              {acceptedTerms && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs text-[#5A635D] leading-relaxed">
              ฉันยอมรับข้อกำหนดในการให้บริการและนโยบายความเป็นส่วนตัวของระบบ RiceBugAI
            </span>
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full h-10 mt-2 rounded-md bg-[#2D7048] hover:bg-[#25593A] active:bg-[#1E4730] text-white text-sm font-medium transition-colors disabled:bg-[#F1F3F2] disabled:text-[#9AA29D] disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <span>ลงทะเบียนบัญชี</span>
            )}
          </button>

        </form>

        <div className="text-center pt-5 mt-5 border-t border-[#E3E6E4] text-xs text-[#5A635D]">
          <span>มีบัญชีสมาชิกอยู่แล้ว? </span>
          <Link
            href="/member/login"
            className="font-medium text-[#2D7048] hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </div>

      </div>
    </div>
  );
}
