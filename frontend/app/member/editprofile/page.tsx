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
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
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

  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'newPassword' | 'confirmPassword', string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    if (field === 'newPassword') setNewPassword(value);
    else setConfirmPassword(value);
    setSuccessMessage(null);
    setApiError(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === 'newPassword' && next.confirmPassword === 'รหัสผ่านยืนยันไม่ตรงกัน') {
        delete next.confirmPassword;
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState | 'newPassword' | 'confirmPassword', string>> = {};

    // Username: ห้ามว่าง, 3–12 ตัว, อังกฤษ+ตัวเลข, ห้ามมีช่องว่าง
    const username = form.username;
    if (!username.trim()) {
      next.username = 'กรุณากรอกชื่อผู้ใช้งาน';
    } else if (/\s/.test(username)) {
      next.username = 'ชื่อผู้ใช้งานต้องไม่มีช่องว่าง';
    } else if (username.length < 3 || username.length > 12) {
      next.username = 'ชื่อผู้ใช้งานต้องมีความยาว 3–12 ตัวอักษร';
    } else if (!/^[A-Za-z0-9]+$/.test(username)) {
      next.username = 'ชื่อผู้ใช้งานใช้ได้เฉพาะภาษาอังกฤษและตัวเลข';
    }

    // Firstname / Lastname: ห้ามว่าง, ภาษาไทย (รวมสระ/วรรณยุกต์), ไม่เกิน 20, ห้ามมีช่องว่าง
    const checkThaiName = (value: string, label: string): string | undefined => {
      if (!value || !value.trim()) return undefined;
      if (/\s/.test(value)) return `${label}ต้องไม่มีช่องว่าง`;
      if (value.length > 20) return `${label}ต้องยาวไม่เกิน 20 ตัวอักษร`;
      if (!/^[\u0E01-\u0E3A\u0E40-\u0E4E]+$/.test(value)) return `${label}ใช้ได้เฉพาะอักขระภาษาไทย`;
      return undefined;
    };
    const firstnameErr = checkThaiName(form.firstname, 'ชื่อจริง');
    if (firstnameErr) next.firstname = firstnameErr;
    const lastnameErr = checkThaiName(form.lastname, 'นามสกุล');
    if (lastnameErr) next.lastname = lastnameErr;

    // Email: ห้ามว่าง, 5–60 ตัว, รูปแบบถูกต้อง, ห้ามมีช่องว่าง
    const email = form.email;
    if (!email.trim()) {
      next.email = 'กรุณากรอกอีเมล';
    } else if (/\s/.test(email)) {
      next.email = 'อีเมลต้องไม่มีช่องว่าง';
    } else if (email.length < 5 || email.length > 60) {
      next.email = 'อีเมลต้องมีความยาว 5–60 ตัวอักษร';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Address: ห้ามว่าง, ไม่เกิน 500 (อนุญาตช่องว่างปกติ)
    const address = form.address.trim();
    if (address && form.address.length > 500) {
      next.address = 'ที่อยู่ต้องยาวไม่เกิน 500 ตัวอักษร';
    }

    // Password: ไม่บังคับกรอก แต่ถ้าเริ่มกรอกต้องตรวจตาม SRS
    if (newPassword !== '' || confirmPassword !== '') {
      if (!newPassword) {
        next.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
      } else if (/\s/.test(newPassword)) {
        next.newPassword = 'รหัสผ่านต้องไม่มีช่องว่าง';
      } else if (newPassword.length < 8 || newPassword.length > 16) {
        next.newPassword = 'รหัสผ่านใหม่ต้องมีความยาว 8–16 ตัวอักษร';
      } else if (!/^[A-Za-z0-9!#_.]+$/.test(newPassword)) {
        next.newPassword = 'รหัสผ่านใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และ ! # _ .';
      }

      if (!confirmPassword) {
        next.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
      } else if (newPassword !== confirmPassword) {
        next.confirmPassword = 'รหัสผ่านยืนยันไม่ตรงกัน';
      }
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
      const payload: Record<string, string | null> = {
        username: form.username.trim(),
        firstname: form.firstname.trim() || null,
        lastname: form.lastname.trim() || null,
        email: form.email.trim(),
        address: form.address.trim() || null,
      };

      if (newPassword.trim()) {
        payload.password = newPassword;
      }

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

      // Reset password fields
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setSuccessMessage(
        newPassword.trim()
          ? 'บันทึกข้อมูลส่วนตัวและเปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
          : 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว'
      );
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

        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/member/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A635D] hover:text-[#111813] transition-colors"
          >
            <ChevronLeft size={14} />
            <span>กลับไปแดชบอร์ด</span>
          </Link>
        </div>

        {/* Header */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4]">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
            แก้ไขข้อมูลส่วนตัว
          </h1>
          <p className="text-sm text-[#5A635D] mt-1">
            จัดการชื่อ-นามสกุล ชื่อผู้ใช้งาน อีเมลติดต่อ และที่อยู่แปลงเพาะปลูกของคุณ
          </p>
        </div>

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
                {errors.firstname && (
                  <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{errors.firstname}</span>
                  </p>
                )}
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
                {errors.lastname && (
                  <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                    <AlertCircle size={13} />
                    <span>{errors.lastname}</span>
                  </p>
                )}
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
              {errors.address && (
                <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                  <AlertCircle size={13} />
                  <span>{errors.address}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-[#5A635D]">
                ข้อมูลที่อยู่นี้จะช่วยในการบันทึกและจัดการพื้นที่เพาะปลูกข้าวของท่าน
              </p>
            </div>

            {/* Change Password Section */}
            <div className="pt-6 border-t border-[#E3E6E4]">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={16} className="text-[#5A635D]" />
                <h3 className="text-sm font-semibold text-[#1A1F1C]">เปลี่ยนรหัสผ่าน</h3>
                <span className="text-xs text-[#5A635D]">(ไม่จำเป็นต้องกรอก)</span>
              </div>
              <p className="text-xs text-[#5A635D] mb-4">
                หากต้องการเปลี่ยนรหัสผ่าน ให้กรอกรหัสผ่านใหม่ด้านล่าง หากไม่ต้องการเปลี่ยน ให้เว้นว่างไว้
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A635D]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      disabled={isSaving}
                      placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                      className={`w-full h-11 pl-10 pr-10 bg-white border rounded-lg text-sm text-[#1A1F1C] focus:outline-none transition-colors ${
                        errors.newPassword
                          ? 'border-[#F4B9B3] focus:border-[#B42318] focus:ring-1 focus:ring-[#F4B9B3]'
                          : 'border-[#CDD2CF] focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048]'
                      } disabled:bg-[#F1F3F2]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5A635D] hover:text-[#1A1F1C] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{errors.newPassword}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F1C] mb-1.5">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A635D]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      disabled={isSaving}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      className={`w-full h-11 pl-10 pr-10 bg-white border rounded-lg text-sm text-[#1A1F1C] focus:outline-none transition-colors ${
                        errors.confirmPassword
                          ? 'border-[#F4B9B3] focus:border-[#B42318] focus:ring-1 focus:ring-[#F4B9B3]'
                          : 'border-[#CDD2CF] focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048]'
                      } disabled:bg-[#F1F3F2]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5A635D] hover:text-[#1A1F1C] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-[#B42318] flex items-center gap-1">
                      <AlertCircle size={13} />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Success Feedback Banner */}
            {successMessage && (
              <div className="p-4 bg-[#E8F5EC] border border-[#B7DFC6] rounded-lg text-xs text-[#1E7B45] flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 size={18} className="shrink-0 text-[#2D7048]" />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-xs text-[#1E7B45] hover:underline cursor-pointer shrink-0"
                >
                  ปิด
                </button>
              </div>
            )}

            {/* Error Feedback Banner */}
            {apiError && (
              <div className="p-4 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-xs text-[#B42318] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 font-medium">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{apiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="text-xs text-[#B42318] hover:underline cursor-pointer shrink-0"
                >
                  ปิด
                </button>
              </div>
            )}

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