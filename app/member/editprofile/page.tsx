'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  User,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface MemberProfile {
  memberID: string;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  address?: string | null;
}

interface FormState {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  address: string;
}

const EMPTY_FORM: FormState = {
  username: '',
  firstname: '',
  lastname: '',
  email: '',
  address: '',
};

const emptySubscribe = () => () => {};

export default function EditProfilePage() {
  const router = useRouter();

  const sessionCookie = useSyncExternalStore(
    emptySubscribe,
    () => Cookies.get('member_session') ?? null,
    () => null
  );

  const memberID = useMemo(() => {
    if (!sessionCookie) return null;
    try {
      const parsed = JSON.parse(sessionCookie);
      return parsed.memberID ?? null;
    } catch {
      return null;
    }
  }, [sessionCookie]);

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const session = Cookies.get('member_session');
    if (!session) {
      router.push('/member/login');
      return;
    }

    try {
      const parsed = JSON.parse(session);
      const mId = parsed.memberID;
      if (!mId) {
        router.push('/member/login');
        return;
      }

      // Fetch latest profile from Backend API
      const fetchProfile = async () => {
        try {
          const res = await fetch(`${API_ORIGIN}/api/v1/members/${mId}`);
          if (!res.ok) {
            // Fallback to session data if GET fails
            setProfile(parsed);
            setForm({
              username: parsed.username || '',
              firstname: parsed.firstname || '',
              lastname: parsed.lastname || '',
              email: parsed.email || '',
              address: parsed.address || '',
            });
            return;
          }

          const data: MemberProfile = await res.json();
          setProfile(data);
          setForm({
            username: data.username || '',
            firstname: data.firstname || '',
            lastname: data.lastname || '',
            email: data.email || '',
            address: data.address || '',
          });
        } catch {
          // Fallback to session data
          setProfile(parsed);
          setForm({
            username: parsed.username || '',
            firstname: parsed.firstname || '',
            lastname: parsed.lastname || '',
            email: parsed.email || '',
            address: parsed.address || '',
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } catch {
      router.push('/member/login');
    }
  }, [router]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
    setApiError(null);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.username.trim()) {
      next.username = 'กรุณากรอกชื่อผู้ใช้งาน';
    } else if (form.username.trim().length < 3) {
      next.username = 'ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
    }

    if (!form.email.trim()) {
      next.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberID) return;

    if (!validate()) return;

    setIsSaving(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        username: form.username.trim(),
        firstname: form.firstname.trim() || null,
        lastname: form.lastname.trim() || null,
        email: form.email.trim(),
        address: form.address.trim() || null,
      };

      const res = await fetch(`${API_ORIGIN}/api/v1/members/${memberID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMessage = 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
        try {
          const body = await res.json();
          if (body?.error) {
            errMessage = body.error;
          } else if (body?.message) {
            errMessage = body.message;
          }
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const updatedMember: MemberProfile = await res.json();
      setProfile(updatedMember);
      setForm({
        username: updatedMember.username || '',
        firstname: updatedMember.firstname || '',
        lastname: updatedMember.lastname || '',
        email: updatedMember.email || '',
        address: updatedMember.address || '',
      });

      // Update Member Session Cookie so all components immediately see the new data
      Cookies.set('member_session', JSON.stringify(updatedMember), { expires: 1 });

      setSuccessMessage('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = [profile?.firstname, profile?.lastname].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D] font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-[#2D7048]" />
        <span>กำลังโหลดข้อมูลส่วนตัว...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">

        {/* Header */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            แก้ไขข้อมูลส่วนตัว
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            จัดการชื่อ-นามสกุล ชื่อผู้ใช้งาน อีเมลติดต่อ และที่อยู่แปลงเพาะปลูกของคุณ
          </p>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-[#E8F5EC] border border-[#B7DFC6] rounded-xl text-sm text-[#1E7B45] flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="shrink-0 text-[#2D7048]" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {apiError && (
          <div className="mb-6 p-4 bg-[#FDECEA] border border-[#F4B9B3] rounded-xl text-sm text-[#B42318] flex items-start gap-3 shadow-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">ข้อผิดพลาด: </span>
              {apiError}
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-xs text-[#B42318] hover:underline cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Profile Card & Form */}
        <div className="bg-white border border-[#E3E6E4] rounded-xl shadow-xs overflow-hidden">

          {/* Profile Header Block */}
          <div className="p-6 bg-[#F7F8F7] border-b border-[#E3E6E4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F5EC] border border-[#B7DFC6] flex items-center justify-center text-[#2D7048] shrink-0">
                <User size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A1F1C]">
                  {fullName ? `${fullName} (${profile?.username})` : profile?.username || 'สมาชิก'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-[#E8F5EC] text-[#1E7B45] border border-[#B7DFC6] font-medium">
                    <ShieldCheck size={12} />
                    <span>สมาชิก</span>
                  </span>
                  <span className="text-xs text-[#5A635D] truncate">
                    {profile?.email || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                ชื่อผู้ใช้งาน (Username) <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A635D]">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  disabled={isSaving}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  className={`w-full h-11 pl-10 pr-3 bg-white border rounded-lg text-sm text-[#1A1F1C] focus:outline-none transition-colors ${
                    errors.username
                      ? 'border-[#F4B9B3] focus:border-[#B42318] focus:ring-1 focus:ring-[#F4B9B3]'
                      : 'border-[#CDD2CF] focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048]'
                  } disabled:bg-[#F1F3F2]`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{errors.username}</span>
                </p>
              )}
            </div>

            {/* Firstname & Lastname Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                  ชื่อจริง
                </label>
                <input
                  type="text"
                  value={form.firstname}
                  onChange={(e) => handleChange('firstname', e.target.value)}
                  disabled={isSaving}
                  placeholder="กรอกชื่อจริง"
                  className="w-full h-11 px-3.5 bg-white border border-[#CDD2CF] rounded-lg text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048] disabled:bg-[#F1F3F2] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                  นามสกุล
                </label>
                <input
                  type="text"
                  value={form.lastname}
                  onChange={(e) => handleChange('lastname', e.target.value)}
                  disabled={isSaving}
                  placeholder="กรอกนามสกุล"
                  className="w-full h-11 px-3.5 bg-white border border-[#CDD2CF] rounded-lg text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048] disabled:bg-[#F1F3F2] transition-colors"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                อีเมล (Email) <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A635D]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isSaving}
                  placeholder="name@example.com"
                  className={`w-full h-11 pl-10 pr-3 bg-white border rounded-lg text-sm text-[#1A1F1C] focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-[#F4B9B3] focus:border-[#B42318] focus:ring-1 focus:ring-[#F4B9B3]'
                      : 'border-[#CDD2CF] focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048]'
                  } disabled:bg-[#F1F3F2]`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                ที่อยู่ / ที่ตั้งแปลงเพาะปลูก
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-[#5A635D]">
                  <MapPin size={16} />
                </div>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={isSaving}
                  placeholder="ระบุตำบล อำเภอ จังหวัด หรือรายละเอียดที่ตั้งแปลงนาข้าว"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#CDD2CF] rounded-lg text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048] disabled:bg-[#F1F3F2] transition-colors resize-none"
                />
              </div>
              <p className="mt-1 text-xs text-[#5A635D]">
                ข้อมูลที่อยู่นี้จะช่วยในการบันทึกและจัดการพื้นที่เพาะปลูกข้าวของท่าน
              </p>
            </div>

            {/* Actions Buttons */}
            <div className="pt-6 border-t border-[#E3E6E4] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Link
                href="/member/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 h-11 rounded-lg text-xs font-medium text-[#5A635D] hover:text-[#1A1F1C] hover:bg-[#F1F3F2] transition-colors"
              >
                ยกเลิก
              </Link>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-[#2D7048] hover:bg-[#25593A] text-white text-xs font-semibold tracking-wide transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>บันทึกการเปลี่ยนแปลง</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
