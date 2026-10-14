'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Cookies from 'js-cookie';
import ImageUpload from '@/app/components/shared/ImageUpload';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  MapPin,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RiceField {
  fieldID: string;
  fieldName: string;
  plantingDate: string;
  areaRai?: number | null;
  areaNgan?: number | null;
  areaSqWah?: number | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  riceAge: number;
  currentGrowthStage?: {
    stageID: string;
    stageName: string;
  };
}

interface RiceGrowthStage {
  stageID: string;
  stageName: string;
  stageDes: string;
  durationRange: string;
}

interface InsectDTO {
  insectID: string;
  insectName: string;
  insectImg?: string[] | null;
  scientificName?: string;
  dangerLevel?: string;
}

interface AuxiliaryResultDTO {
  stage: string;
  stageName: string;
  insectName: string;
  confidenceScore: number;
}

interface AnalysisResultDTO {
  analysisID: string;
  analysisDate: string;
  analysisImage: string;
  confidenceScore: number;
  recommendation?: string | null;
  insect: InsectDTO;
  riceGrowthStage: RiceGrowthStage;
  fieldID?: string | null;
  auxiliaryResults?: AuxiliaryResultDTO[] | null;
}

// 3 stages supported by AI model (exclude 'ระยะสุกแก่')
const SUPPORTED_AI_STAGES = ['ระยะกล้า', 'ระยะแตกกอ', 'ระยะออกรวง'];

function AnalysisInsectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFieldId = searchParams.get('fieldID');

  const [memberID, setMemberID] = useState<string | null>(null);
  const [fields, setFields] = useState<RiceField[]>([]);
  const [stages, setStages] = useState<RiceGrowthStage[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedFieldID, setSelectedFieldID] = useState<string>(preselectedFieldId || '');
  const [selectedStageID, setSelectedStageID] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Analysis / Result State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultDTO | null>(null);

  // Analysis History from Backend API
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResultDTO[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Check Session & Load Initial Data
  useEffect(() => {
    const session = Cookies.get('member_session');
    if (!session) {
      router.push('/member/login');
      return;
    }

    try {
      const member = JSON.parse(session);
      const mId = member.memberID;

      const fetchInitialData = async () => {
        setMemberID(mId);
        try {
          const [fieldsRes, stagesRes, historyRes] = await Promise.allSettled([
            fetch(`${API_ORIGIN}/api/v1/members/${mId}/fields`),
            fetch(`${API_ORIGIN}/api/v1/rice-growth-stages`),
            fetch(`${API_ORIGIN}/api/v1/members/${mId}/analysis`),
          ]);

          if (fieldsRes.status === 'fulfilled' && fieldsRes.value.ok) {
            const fieldsData = await fieldsRes.value.json();
            if (Array.isArray(fieldsData)) {
              setFields(fieldsData);
              if (preselectedFieldId && fieldsData.some((f: RiceField) => f.fieldID === preselectedFieldId)) {
                setSelectedFieldID(preselectedFieldId);
              }
            }
          }

          if (stagesRes.status === 'fulfilled' && stagesRes.value.ok) {
            const stagesData: RiceGrowthStage[] = await stagesRes.value.json();
            if (Array.isArray(stagesData)) {
              // Filter strictly to the 3 AI-supported stages
              const filtered = stagesData.filter((s) =>
                SUPPORTED_AI_STAGES.includes(s.stageName.trim())
              );
              setStages(filtered);
            }
          }

          if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
            const historyData = await historyRes.value.json();
            if (Array.isArray(historyData)) {
              setAnalysisHistory(historyData);
            }
          }
        } catch {
          // Graceful fallback
        } finally {
          setLoadingInitial(false);
        }
      };

      fetchInitialData();
    } catch {
      router.push('/member/login');
    }
  }, [router, preselectedFieldId]);

  // Selected Field Details
  const currentSelectedField = useMemo(() => {
    return fields.find((f) => f.fieldID === selectedFieldID) || null;
  }, [fields, selectedFieldID]);

  // Field derived from analysisResult.fieldID (for result view)
  const analysisResultField = useMemo(() => {
    if (!analysisResult?.fieldID) return null;
    return fields.find((f) => f.fieldID === analysisResult.fieldID) || null;
  }, [fields, analysisResult]);

  // File Handlers
  const handleFileChange = (file: File | null) => {
    setErrorMessage(null);
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ขนาดไฟล์รูปภาพเกิน 5 MB กรุณาเลือกรูปภาพขนาดเล็กกว่านี้');
      return;
    }

    // Validate image mime type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, JPEG, WEBP)');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    handleRemoveFile();
    setSelectedStageID('');
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  // Submit Analysis to Backend
  const handleAnalyze = async () => {
    if (!memberID) {
      setErrorMessage('ไม่พบข้อมูลสมาชิก กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('กรุณาเลือกหรืออัปโหลดรูปภาพแมลงศัตรูพืช');
      return;
    }

    // Validation rule: If no field selected, stageID is required
    if (!selectedFieldID && !selectedStageID) {
      setErrorMessage('กรุณาเลือกระยะการเจริญเติบโตของข้าวเมื่อไม่ได้ระบุแปลงนา');
      return;
    }

    // Validation rule: If field selected, check if stage is ripe ('ระยะสุกแก่')
    if (currentSelectedField?.currentGrowthStage?.stageName === 'ระยะสุกแก่') {
      setErrorMessage('แปลงนานี้อยู่ในระยะสุกแก่ ไม่รองรับการวิเคราะห์แมลงในระยะนี้');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      // Rule: With field => fieldID present, stageID null
      // Rule: Without field => fieldID null, stageID present
      const analysisPayload = {
        fieldID: selectedFieldID ? selectedFieldID : null,
        stageID: selectedFieldID ? null : selectedStageID || null,
      };

      formData.append(
        'data',
        new Blob([JSON.stringify(analysisPayload)], { type: 'application/json' })
      );
      formData.append('image', selectedFile);

      const res = await fetch(`${API_ORIGIN}/api/v1/members/${memberID}/analysis`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errText = 'เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่อีกครั้ง';
        try {
          const errData = await res.json();
          if (errData?.error) {
            errText = errData.error;
          } else if (res.status === 422) {
            errText = 'ระบบไม่มั่นใจในผลการวิเคราะห์เพียงพอ กรุณาถ่ายภาพใหม่ให้ชัดเจนขึ้นแล้วลองอีกครั้ง';
          } else if (res.status === 503) {
            errText = 'ระบบ AI ยังไม่พร้อมให้บริการในขณะนี้ กรุณาลองใหม่อีกครั้งในภายหลัง';
          }
        } catch {
          // If response not JSON, use status-specific fallback
          if (res.status === 422) {
            errText = 'ระบบไม่มั่นใจในผลการวิเคราะห์เพียงพอ กรุณาถ่ายภาพใหม่ให้ชัดเจนขึ้นแล้วลองอีกครั้ง';
          } else if (res.status === 503) {
            errText = 'ระบบ AI ยังไม่พร้อมให้บริการในขณะนี้ กรุณาลองใหม่อีกครั้งในภายหลัง';
          }
        }
        throw new Error(errText);
      }

      const resultData: AnalysisResultDTO = await res.json();
      setAnalysisResult(resultData);
      setAnalysisHistory((prev) => [
        resultData,
        ...prev.filter((item) => item.analysisID !== resultData.analysisID),
      ]);

      // Save to sessionStorage so it can be retrieved if navigated
      try {
        sessionStorage.setItem('analysis_result', JSON.stringify(resultData));
      } catch {
        // ignore storage quota errors
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#3F4742] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* Header */}
        <div className="pb-6 mb-8 border-b border-[#E3E6E4] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1F1C]">
              วิเคราะห์แมลง
            </h1>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#FDECEA] border border-[#F4B9B3] rounded-lg text-sm text-[#B42318] flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">ข้อผิดพลาด: </span>
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-[#B42318] hover:underline cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* RESULT VIEW (If Analysis Completed) */}
        {analysisResult ? (
          <div className="space-y-6">
            <div className="bg-white border border-[#E3E6E4] rounded-xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#E3E6E4] gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5EC] border border-[#B7DFC6] flex items-center justify-center text-[#2D7048]">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1F1C]">ผลการวิเคราะห์จำแนกแมลง</h2>
                    <p className="text-xs text-[#5A635D]">
                      วิเคราะห์เมื่อ {formatDate(analysisResult.analysisDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-medium text-[#1A1F1C] bg-white border border-[#CDD2CF] rounded-md hover:bg-[#F1F3F2] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>วิเคราะห์รูปภาพใหม่</span>
                  </button>
                </div>
              </div>

              {/* Main Analysis Result Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Uploaded Image + AI Score */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="relative w-full aspect-4/3 bg-[#F1F3F2] rounded-lg border border-[#E3E6E4] overflow-hidden">
                    <Image
                      src={analysisResult.analysisImage || previewUrl || ''}
                      alt="Uploaded image"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="p-4 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#5A635D]">
                      <span>ความมั่นใจของโมเดล AI</span>
                      <span className="font-bold text-[#1A1F1C] text-sm tabular-nums">
                        {analysisResult.confidenceScore != null
                          ? `${analysisResult.confidenceScore.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    {/* Confidence Meter Bar */}
                    <div className="w-full h-2.5 bg-[#E3E6E4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2D7048] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, analysisResult.confidenceScore || 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Insect Prediction & Details */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D7048] bg-[#E8F5EC] border border-[#B7DFC6] px-2.5 py-1 rounded-md mb-2">
                        <Sparkles size={13} />
                        <span>ตรวจพบแมลงศัตรูพืช</span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#1A1F1C]">
                        {analysisResult.insect.insectName}
                      </h3>
                      {analysisResult.insect.scientificName && (
                        <p className="text-sm italic text-[#5A635D] mt-0.5">
                          {analysisResult.insect.scientificName}
                        </p>
                      )}
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg">
                        <div className="text-xs text-[#5A635D] flex items-center gap-1.5 mb-1">
                          <Layers size={14} className="text-[#2D7048]" />
                          <span>ระยะการเจริญเติบโต</span>
                        </div>
                        <div className="text-sm font-semibold text-[#1A1F1C]">
                          {analysisResult.riceGrowthStage.stageName}
                        </div>
                        {analysisResult.riceGrowthStage.stageDes && (
                          <div className="text-xs text-[#5A635D] mt-0.5">
                            {analysisResult.riceGrowthStage.stageDes}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg">
                        <div className="text-xs text-[#5A635D] flex items-center gap-1.5 mb-1">
                          <MapPin size={14} className="text-[#2D7048]" />
                          <span>แปลงนาข้าว</span>
                        </div>
                        <div className="text-sm font-semibold text-[#1A1F1C]">
                          {(() => {
                            if (!analysisResult.fieldID) {
                              return 'ไม่ได้ระบุแปลง (ระบุระยะด้วยตนเอง)';
                            }
                            if (loadingInitial) {
                              return 'กำลังโหลดข้อมูลแปลง...';
                            }
                            return analysisResultField
                              ? analysisResultField.fieldName
                              : 'ไม่พบข้อมูลแปลง';
                          })()}
                        </div>
                        {analysisResult.fieldID && !loadingInitial && analysisResultField && (
                          <div className="text-xs text-[#5A635D] mt-0.5">
                            อายุข้าว {analysisResultField.riceAge} วัน
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reference Images from DB */}
                    {analysisResult.insect.insectImg && analysisResult.insect.insectImg.length > 0 && (
                      <div className="pt-2">
                        <div className="text-xs font-semibold text-[#1A1F1C] mb-2">
                          ภาพอ้างอิงจากฐานข้อมูล ({analysisResult.insect.insectImg.length} รูป):
                        </div>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                          {analysisResult.insect.insectImg.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative w-24 h-20 shrink-0 bg-[#F1F3F2] rounded-md border border-[#E3E6E4] overflow-hidden"
                            >
                              <Image
                                src={imgUrl}
                                alt={`${analysisResult.insect.insectName} ${idx + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Auxiliary Results (other stage predictions) */}
                  {analysisResult.auxiliaryResults && analysisResult.auxiliaryResults.length > 0 && (
                    <div className="pt-4">
                      <div className="p-4 bg-[#F7F8F7] border border-[#E3E6E4] rounded-lg space-y-2.5">
                        <div className="text-xs font-semibold text-[#5A635D] flex items-center gap-1.5">
                          <Info size={13} className="text-[#5A635D]" />
                          <span>ผลการวิเคราะห์ประกอบจากระยะอื่น</span>
                        </div>
                        <div className="space-y-2">
                          {analysisResult.auxiliaryResults.map((aux, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs p-2.5 bg-white border border-[#E3E6E4] rounded-md"
                            >
                              <span className="text-[#3F4742]">
                                ภาพนี้อาจใกล้เคียงกับ <strong className="text-[#1A1F1C]">{aux.insectName}</strong>{' '}
                                (ระยะ{aux.stageName})
                              </span>
                              <span className="text-[#5A635D] tabular-nums shrink-0 pl-3">
                                {aux.confidenceScore != null ? `${aux.confidenceScore.toFixed(1)}%` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-6 border-t border-[#E3E6E4] flex flex-wrap items-center gap-3">
                    <Link
                      href={`/member/viewinsect?id=${analysisResult.insect.insectID}`}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-[#2D7048] hover:bg-[#25593A] text-white text-sm font-medium transition-colors"
                    >
                      <span>ดูรายละเอียดแมลงและวิธีกำจัด</span>
                      <ArrowRight size={16} />
                    </Link>

                    {(() => {
                      const params = new URLSearchParams();
                      params.set('insectID', analysisResult.insect.insectID);
                      if (analysisResult.fieldID) {
                        params.set('fieldID', analysisResult.fieldID);
                      }
                      params.set('source', 'analysis');
                      return (
                        <Link
                          href={`/member/calculation?${params.toString()}`}
                          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-white hover:bg-[#F1F3F2] border border-[#CDD2CF] text-[#1A1F1C] text-sm font-medium transition-colors"
                        >
                          <span>คำนวณสารเคมีสำหรับแมลงนี้</span>
                          <ExternalLink size={15} />
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (Main Form) */}
            <div className="lg:col-span-7 space-y-6">

              {/* 1. Field Selection & Display Card */}
              <div className="bg-white border border-[#E3E6E4] rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <label className="text-sm font-bold text-[#1A1F1C] block">
                      เลือกแปลงนาข้าว (ทางเลือก)
                    </label>
                    <p className="text-xs text-[#5A635D] mt-0.5">
                      หากเลือกแปลงนา ระบบจะคำนวณอายุข้าวและประเมินระยะการเจริญเติบโตให้อัตโนมัติ
                    </p>
                  </div>

                  <select
                    value={selectedFieldID}
                    onChange={(e) => {
                      setSelectedFieldID(e.target.value);
                      if (e.target.value) {
                        setSelectedStageID(''); // Clear manual stage
                      }
                    }}
                    className="h-9 px-3 rounded-md bg-white border border-[#CDD2CF] text-xs text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048] max-w-xs"
                  >
                    <option value="">-- ไม่เลือกแปลงนา (ระบุระยะเอง) --</option>
                    {fields.map((f) => {
                      const areaStr = [
                        f.areaRai ? `${f.areaRai} ไร่` : '',
                        f.areaNgan ? `${f.areaNgan} งาน` : '',
                        f.areaSqWah ? `${f.areaSqWah} ตร.ว.` : '',
                      ].filter(Boolean).join(' ') || '0 ไร่';
                      return (
                        <option key={f.fieldID} value={f.fieldID}>
                          {f.fieldName} ({areaStr} - {f.riceAge} วัน)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Field Details Matrix (Shown when field is selected) */}
                {currentSelectedField ? (
                  <div className="mt-4 pt-4 border-t border-[#E3E6E4]">
                    <div className="text-xs font-semibold text-[#1A1F1C] mb-3">
                      ข้อมูลนาข้าวที่คุณเลือก
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md">
                      <div>
                        <div className="text-xs text-[#5A635D]">สถานที่ปลูก / ชื่อแปลง</div>
                        <div className="text-sm font-bold text-[#1A1F1C] mt-0.5 truncate">
                          {currentSelectedField.fieldName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#5A635D]">วันที่เริ่มปลูก</div>
                        <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">
                          {formatDate(currentSelectedField.plantingDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#5A635D]">ขนาดพื้นที่</div>
                        <div className="text-sm font-semibold text-[#1A1F1C] mt-0.5">
                          {[
                            currentSelectedField.areaRai ? `${currentSelectedField.areaRai} ไร่` : '',
                            currentSelectedField.areaNgan ? `${currentSelectedField.areaNgan} งาน` : '',
                            currentSelectedField.areaSqWah ? `${currentSelectedField.areaSqWah} ตร.ว.` : '',
                          ].filter(Boolean).join(' ') || '0 ไร่'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#5A635D]">อายุข้าว</div>
                        <div className="text-sm font-bold text-[#2D7048] mt-0.5">
                          {currentSelectedField.riceAge} วัน
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#5A635D]">
                      <Info size={13} className="text-[#2D7048]" />
                      <span>
                        ประเมินระยะปัจจุบัน:{' '}
                        <strong className="text-[#1A1F1C]">
                          {currentSelectedField.currentGrowthStage?.stageName || 'คำนวณอัตโนมัติ'}
                        </strong>{' '}
                        (ระบบ Backend จะระบุโมเดล AI ที่เหมาะสมให้อัตโนมัติ)
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 2. Manual Rice Growth Stage Selector (Shown when NO field is selected) */
                  <div className="mt-4 pt-4 border-t border-[#E3E6E4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-[#1A1F1C]">
                        เลือกระยะข้าว
                      </div>
                      <div className="text-xs text-[#5A635D] mt-0.5">
                        เลือกขั้นตอนปัจจุบันเพื่อการวินิจฉัยที่แม่นยำยิ่งขึ้น (เฉพาะระยะที่ AI รองรับ)
                      </div>
                    </div>

                    <div className="w-full sm:w-64">
                      <select
                        value={selectedStageID}
                        onChange={(e) => setSelectedStageID(e.target.value)}
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#CDD2CF] text-sm text-[#1A1F1C] focus:outline-none focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048]"
                      >
                        <option value="">เลือกระยะข้าว ...</option>
                        {stages.map((stage) => (
                          <option key={stage.stageID} value={stage.stageID}>
                            {stage.stageName} ({stage.durationRange} วัน)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Drag and Drop Image Upload Zone */}
              <div className="space-y-0">
                <ImageUpload
                  label="รูปภาพแมลงศัตรูพืช"
                  description="อัปโหลดภาพถ่ายจากแปลงนาเพื่อส่งให้ AI ประเมินและจำแนกชนิด"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  maxSizeBytes={5 * 1024 * 1024}
                  helperText="รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)"
                  mode="single"
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onFileSelect={(file) => handleFileChange(file)}
                  onFileRemove={handleRemoveFile}
                  disabled={isAnalyzing}
                />

                {/* Photography Guidelines Card (Directly attached under Upload Box) */}
                <div className="bg-[#F8FAF8] border border-t-0 border-[#E1E6E2] rounded-b-xl p-4 space-y-2 text-xs text-[#65716A]">
                  <div className="flex items-center gap-1.5 font-bold text-[#111813]">
                    <ShieldAlert size={15} className="text-[#2D7048]" />
                    <span>คำแนะนำในการถ่ายภาพเพื่อผลที่แม่นยำ</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 leading-relaxed text-[#4B5750]">
                    <li>จัดให้มีแสงสว่างเพียงพอ</li>
                    <li>หลีกเลี่ยงภาพย้อนแสงหรือภาพเบลอ</li>
                  </ul>
                </div>
              </div>

              {/* 4. Bottom Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isAnalyzing || (!selectedFile && !selectedStageID && !selectedFieldID)}
                  className="px-5 h-10 text-xs font-semibold text-[#65716A] hover:text-[#111813] hover:bg-[#F1F4F2] rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !selectedFile}
                  className="inline-flex items-center justify-center gap-2 min-w-32 h-10 px-6 text-xs font-semibold text-white bg-[#2D7048] hover:bg-[#25593A] rounded-lg shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>กำลังวิเคราะห์...</span>
                    </>
                  ) : (
                    <span>วิเคราะห์แมลง</span>
                  )}
                </button>
              </div>

            </div>

            {/* Right Column: Recent Analysis History */}
            <div className="lg:col-span-5 space-y-6">

              {/* Recent Analysis History Card */}
              <div className="bg-white border border-[#E1E6E2] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E1E6E2]">
                  <h3 className="text-sm font-bold text-[#111813]">ประวัติการวิเคราะห์ล่าสุด</h3>
                  <span className="text-xs text-[#65716A]">
                    {analysisHistory.length > 0 ? `${analysisHistory.length} รายการ` : ''}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analysisHistory.length > 0 ? (
                    analysisHistory.slice(0, 6).map((item) => {
                      const firstImg =
                        item.analysisImage ||
                        (item.insect.insectImg && item.insect.insectImg.length > 0
                          ? item.insect.insectImg[0]
                          : null);
                      const confText =
                        item.confidenceScore != null
                          ? `${item.confidenceScore.toFixed(1)}%`
                          : '—';

                      return (
                        <button
                          key={item.analysisID}
                          type="button"
                          onClick={() => {
                            setAnalysisResult(item);
                            try {
                              sessionStorage.setItem('analysis_result', JSON.stringify(item));
                            } catch {
                              // ignore
                            }
                          }}
                          className="w-full text-left group flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAF8] transition-colors cursor-pointer border border-transparent hover:border-[#E1E6E2]"
                          title="คลิกเพื่อดูผลการวิเคราะห์นี้"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-11 h-11 rounded-lg bg-[#F1F4F2] border border-[#E1E6E2] overflow-hidden shrink-0">
                              {firstImg ? (
                                <Image
                                  src={firstImg}
                                  alt={item.insect.insectName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-[#65716A]">
                                  ภาพ
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#111813] group-hover:text-[#2D7048] transition-colors truncate">
                                {item.insect.insectName}
                              </div>
                              <div className="text-[11px] text-[#65716A] truncate mt-0.5">
                                {formatDate(item.analysisDate)}
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-[#156E3B] tabular-nums shrink-0 pl-2">
                            {confText}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-xs text-[#65716A] text-center py-8">
                      {loadingInitial ? 'กำลังโหลดประวัติ...' : 'ยังไม่มีประวัติการวิเคราะห์'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function MemberAnalysisInsectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8F7] py-24 text-center flex flex-col items-center justify-center gap-2 text-sm text-[#5A635D]">
          <Loader2 className="animate-spin text-[#2D7048]" size={24} />
          <span>กำลังโหลดหน้าวิเคราะห์แมลง...</span>
        </div>
      }
    >
      <AnalysisInsectContent />
    </Suspense>
  );
}
