"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GrowthStage {
  stageID: string;
  stageName: string;
}

export interface RiceField {
  fieldID: string;
  fieldName: string;
  plantingDate: string;
  areaSize: number;
  areaUnit: string;
  riceAge: number;
  currentGrowthStage?: GrowthStage;
}

interface MyFieldsPageProps {
  onAnalyzeField?: (field: RiceField) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MyFieldsPage({ onAnalyzeField }: MyFieldsPageProps) {
  const router = useRouter();

  const [fields, setFields] = useState<RiceField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberID, setMemberID] = useState<string | null>(null);

  // State สำหรับปุ่มลบ
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const reloadFields = async () => {
    if (!memberID) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/v1/members/${memberID}/fields`);
      if (!res.ok) throw new Error("โหลดข้อมูลแปลงนาไม่สำเร็จ");
      const data: RiceField[] = await res.json();
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const session = Cookies.get("member_session");
    if (!session) {
      router.push("/member/login");
    } else {
      Promise.resolve().then(() => {
        const member = JSON.parse(session);
        setMemberID(member.memberID);
      });
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const loadFields = async (mId: string) => {
      try {
        const res = await fetch(`${API_URL}/api/v1/members/${mId}/fields`);
        if (!res.ok) throw new Error("โหลดข้อมูลแปลงนาไม่สำเร็จ");
        const data: RiceField[] = await res.json();

        if (!cancelled) {
          setFields(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
          setIsLoading(false);
        }
      }
    };

    if (memberID) {
      loadFields(memberID);
    }

    return () => {
      cancelled = true;
    };
  }, [memberID]);

  const handleDelete = async (fieldID: string, fieldName: string) => {
    if (!memberID) return;

    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแปลง "${fieldName}"?`)) {
      return;
    }

    setIsDeletingId(fieldID);
    try {
      const res = await fetch(`${API_URL}/api/v1/members/${memberID}/fields/${fieldID}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error("ลบข้อมูลแปลงนาไม่สำเร็จ");
      }

      // รีโหลดข้อมูลหลังจากลบสำเร็จ
      setFields(fields.filter(f => f.fieldID !== fieldID));
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeletingId(null);
    }
  };

  const formatArea = (areaSize: number, areaUnit: string) =>
    `${areaSize} ${areaUnit}`;

  return (
    <div className="min-h-screen bg-[#F3F5F1] p-6 pt-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แปลงนาของฉัน</h1>
            <p className="mt-1 text-sm text-green-700">
              ภาพรวมและการจัดการข้อมูลแปลงปลูก
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/member/addfield")}
            className="h-12 px-5 rounded-xl bg-green-500 text-white flex items-center gap-2 text-sm font-semibold shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-green-600 transition-colors whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={2.5} />
            เพิ่มแปลงนาใหม่
          </button>
        </div>

        {/* States */}
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-gray-200 bg-white animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 flex flex-col items-center gap-3 text-center text-sm text-red-700">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <p>{error}</p>
            <button
              onClick={() => reloadFields()}
              className="mt-2 px-4 py-2 bg-white rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {!isLoading && !error && fields.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">ยังไม่มีแปลงนา</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">เริ่มเพิ่มแปลงแรกของคุณเพื่อเข้าสู่ระบบประเมิน</p>
            <button
              onClick={() => router.push("/member/addfield")}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              เพิ่มแปลงนาเลย
            </button>
          </div>
        )}

        {/* Field list */}
        {!isLoading && !error && fields.length > 0 && (
          <div className="space-y-4 mb-10">
            {fields.map((field, index) => (
              <div
                key={field.fieldID}
                className="rounded-xl border border-gray-200 bg-white px-7 py-5 shadow-sm hover:shadow-md transition-shadow group relative"
              >
                {/* ปุ่มลบ (อยู่มุมขวาบน) */}
                <button
                  onClick={() => handleDelete(field.fieldID, field.fieldName)}
                  disabled={isDeletingId === field.fieldID}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="ลบแปลงนานี้"
                >
                  {isDeletingId === field.fieldID ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>

                <div className="flex items-center gap-3 mb-5 pr-10">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {field.fieldName}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">
                    ระยะ{field.currentGrowthStage?.stageName || "ไม่ระบุระยะ"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-x-12 gap-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wide uppercase">วันที่ปลูก</p>
                      <p className="text-sm font-bold text-gray-800">
                        {new Date(field.plantingDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wide uppercase">ขนาดพื้นที่</p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatArea(field.areaSize, field.areaUnit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 tracking-wide uppercase">อายุข้าว</p>
                      <p className="text-sm font-bold text-gray-800 text-green-700">
                        {field.riceAge} วัน
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAnalyzeField?.(field)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-300 transition-all whitespace-nowrap"
                  >
                    เริ่มประเมิน
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}