'use client';

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

export interface ImageUploadProps {
  /** Label displayed above the upload area */
  label?: string;
  /** Subtitle/Helper text under the label */
  description?: string;
  /** Accept file types string e.g. "image/jpeg,image/png,image/jpg,image/webp" */
  accept?: string;
  /** Max file size in bytes (e.g. 5 * 1024 * 1024 for 5MB) */
  maxSizeBytes?: number;
  /** User-friendly limit text e.g. "รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB" */
  helperText?: string;
  /** Mode: 'single' or 'multiple' */
  mode?: 'single' | 'multiple';
  /** Max files allowed (for multiple mode) */
  maxFiles?: number;

  // Single file mode values
  selectedFile?: File | null;
  previewUrl?: string | null;
  existingImageUrl?: string | null;
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;

  // Multiple file mode values
  selectedFiles?: File[];
  previewUrls?: string[];
  existingImageUrls?: string[];
  onFilesAdd?: (files: File[]) => void;
  onFileRemoveIndex?: (index: number) => void;
  onExistingRemoveIndex?: (index: number) => void;

  /** Custom error message string from parent */
  errorMessage?: string | null;
  /** Callback when internal validation fails */
  onError?: (msg: string | null) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Optional custom class */
  className?: string;
}

export default function ImageUpload({
  label,
  description,
  accept = 'image/jpeg,image/png,image/jpg,image/webp',
  maxSizeBytes = 5 * 1024 * 1024,
  helperText = 'รองรับไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)',
  mode = 'single',
  maxFiles = 5,
  selectedFile = null,
  previewUrl = null,
  existingImageUrl = null,
  onFileSelect,
  onFileRemove,
  selectedFiles = [],
  previewUrls = [],
  existingImageUrls = [],
  onFilesAdd,
  onFileRemoveIndex,
  onExistingRemoveIndex,
  errorMessage = null,
  onError,
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = errorMessage || localError;

  const validateFile = (file: File): boolean => {
    // Check type
    const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const isTypeValid = acceptedTypes.some((t) => {
      if (t.endsWith('/*')) {
        const prefix = t.slice(0, -2);
        return fileType.startsWith(prefix);
      }
      return fileType === t;
    });

    if (!isTypeValid && acceptedTypes.length > 0) {
      const msg = 'ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ภาพตามที่กำหนด';
      setLocalError(msg);
      onError?.(msg);
      return false;
    }

    // Check size
    if (maxSizeBytes && file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      const msg = `ขนาดไฟล์ใหญ่เกินกำหนด (สูงสุด ${maxMb}MB)`;
      setLocalError(msg);
      onError?.(msg);
      return false;
    }

    setLocalError(null);
    onError?.(null);
    return true;
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (mode === 'single') {
      const file = fileArray[0];
      if (validateFile(file)) {
        onFileSelect?.(file);
      }
    } else {
      const validFiles: File[] = [];
      const totalExisting = (existingImageUrls?.length || 0) + (selectedFiles?.length || 0);

      for (const f of fileArray) {
        if (totalExisting + validFiles.length >= maxFiles) {
          const msg = `สามารถอัปโหลดรูปภาพได้สูงสุด ${maxFiles} รูป`;
          setLocalError(msg);
          onError?.(msg);
          break;
        }
        if (validateFile(f)) {
          validFiles.push(f);
        }
      }

      if (validFiles.length > 0) {
        onFilesAdd?.(validFiles);
      }
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  // Single mode has active image if previewUrl or existingImageUrl
  const singleHasImage = mode === 'single' && Boolean(previewUrl || existingImageUrl);
  const singleImageSrc = previewUrl || existingImageUrl || '';

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Label and Description */}
      {(label || description) && (
        <div>
          {label && (
            <label className="text-sm font-semibold text-[#111813] block">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[#65716A] mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={mode === 'multiple'}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Mode: SINGLE with Image Preview */}
      {mode === 'single' && singleHasImage ? (
        <div className="bg-white border border-[#E1E6E2] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="relative w-full aspect-4/3 sm:aspect-16/9 max-h-72 bg-[#F8FAF8] rounded-lg border border-[#E1E6E2] overflow-hidden">
            <Image
              src={singleImageSrc}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E1E6E2]">
            <div className="text-xs text-[#65716A] truncate">
              {selectedFile ? (
                <span className="font-medium text-[#111813]">{selectedFile.name}</span>
              ) : (
                <span>รูปภาพปัจจุบัน</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 h-8.5 text-xs font-semibold text-[#111813] bg-white border border-[#CBD3CE] hover:bg-[#F1F4F2] rounded-lg transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className="text-[#65716A]" />
                <span>เปลี่ยนรูป</span>
              </button>

              <button
                type="button"
                onClick={onFileRemove}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 h-8.5 text-xs font-semibold text-[#B42318] bg-[#FDECEA] border border-[#F4B9B3] hover:bg-[#B42318] hover:text-white rounded-lg transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>ลบรูป</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone (Single without image OR Multiple dropzone) */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            disabled
              ? 'bg-[#F1F4F2] border-[#CBD3CE] cursor-not-allowed opacity-60'
              : dragActive
              ? 'border-[#2D7048] bg-[#E8F6ED]'
              : 'border-[#CBD3CE] bg-white hover:border-[#2D7048] hover:bg-[#F8FAF8]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-[#E8F6ED] border border-[#B2DEC3] flex items-center justify-center text-[#156E3B]">
              <UploadCloud size={24} />
            </div>

            <div>
              <div className="text-sm font-semibold text-[#111813]">
                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
              </div>
              <p className="text-xs text-[#65716A] mt-1">{helperText}</p>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-1 inline-flex items-center justify-center px-4 h-8.5 rounded-lg bg-white border border-[#CBD3CE] hover:bg-[#F1F4F2] text-[#111813] text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              เลือกไฟล์จากอุปกรณ์
            </button>
          </div>
        </div>
      )}

      {/* Mode: MULTIPLE Gallery Previews */}
      {mode === 'multiple' && (existingImageUrls.length > 0 || previewUrls.length > 0) && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-[#65716A]">
            รูปภาพทั้งหมด ({existingImageUrls.length + previewUrls.length} / {maxFiles}):
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Existing Images */}
            {existingImageUrls.map((url, idx) => (
              <div
                key={`existing-${idx}`}
                className="group relative aspect-square bg-[#F8FAF8] rounded-lg border border-[#E1E6E2] overflow-hidden shadow-2xs"
              >
                <Image
                  src={url}
                  alt={`Existing ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-1 right-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExistingRemoveIndex?.(idx);
                    }}
                    className="p-1 rounded-md bg-black/60 hover:bg-[#B42318] text-white transition-colors cursor-pointer"
                    title="ลบรูปภาพนี้"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                  เดิม
                </span>
              </div>
            ))}

            {/* New Preview Images */}
            {previewUrls.map((url, idx) => (
              <div
                key={`preview-${idx}`}
                className="group relative aspect-square bg-[#F8FAF8] rounded-lg border border-[#B2DEC3] overflow-hidden shadow-2xs ring-1 ring-[#B2DEC3]"
              >
                <Image
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-1 right-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemoveIndex?.(idx);
                    }}
                    className="p-1 rounded-md bg-black/60 hover:bg-[#B42318] text-white transition-colors cursor-pointer"
                    title="ลบรูปภาพนี้"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#156E3B]/80 text-[10px] text-white font-medium">
                  ใหม่
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {activeError && (
        <div className="flex items-center gap-1.5 text-xs text-[#B42318] bg-[#FDECEA] border border-[#F4B9B3] p-2.5 rounded-lg">
          <AlertCircle size={14} className="shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
