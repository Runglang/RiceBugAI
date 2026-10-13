'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog body / description (supports JSX) */
  message: React.ReactNode;
  /** Label for the confirm (destructive) button */
  confirmLabel?: string;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels or clicks the backdrop */
  onCancel: () => void;
  /** Show a spinner on the confirm button and disable both buttons */
  isLoading?: boolean;
}

/**
 * Reusable confirmation dialog styled to match the existing
 * delete-confirmation modal in `admin/dashboard/page.tsx`.
 *
 * Renders a fixed overlay with a centered card.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'ยืนยันการลบ',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#1A1F1C]/75 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E3E6E4] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FDECEA] text-[#B42318] flex items-center justify-center shrink-0 border border-[#F4B9B3]">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1F1C]">{title}</h3>
            <div className="text-xs text-[#5A635D] mt-1 leading-relaxed">{message}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3E6E4]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 h-9 text-xs font-medium text-[#1A1F1C] bg-white border border-[#CDD2CF] rounded-md hover:bg-[#F1F3F2] transition-colors disabled:opacity-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 text-xs font-medium text-white bg-[#B42318] hover:bg-[#912018] rounded-md transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
