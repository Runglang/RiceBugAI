'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ───────── Types ───────── */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/* ───────── Context ───────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

/* ───────── Styling per type (project palette) ───────── */

const STYLE_MAP: Record<
  ToastType,
  { bg: string; border: string; text: string; icon: typeof CheckCircle2 }
> = {
  success: {
    bg: 'bg-[#E8F5EC]',
    border: 'border-[#B7DFC6]',
    text: 'text-[#1E7B45]',
    icon: CheckCircle2,
  },
  error: {
    bg: 'bg-[#FDECEA]',
    border: 'border-[#F4B9B3]',
    text: 'text-[#B42318]',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-[#FEF3CD]',
    border: 'border-[#F5D780]',
    text: 'text-[#856404]',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-[#E3F2FD]',
    border: 'border-[#90CAF9]',
    text: 'text-[#1565C0]',
    icon: Info,
  },
};

/** Auto-dismiss duration (ms). Error stays until manually closed. */
const AUTO_DISMISS_MS = 3000;

/* ───────── Provider ───────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  /* ── helpers ── */

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-dismiss for non-error toasts
      if (type !== 'error') {
        setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
      }
    },
    [removeToast],
  );

  const value: ToastContextValue = {
    success: useCallback((msg: string) => addToast('success', msg), [addToast]),
    error: useCallback((msg: string) => addToast('error', msg), [addToast]),
    warning: useCallback((msg: string) => addToast('warning', msg), [addToast]),
    info: useCallback((msg: string) => addToast('info', msg), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container — fixed top-right, doesn't block clicks elsewhere */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none"
          style={{ maxWidth: 'min(400px, calc(100vw - 2rem))' }}
        >
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/* ───────── Single toast card ───────── */

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { bg, border, text, icon: Icon } = STYLE_MAP[item.type];

  // Slide-in animation via useEffect
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // trigger CSS transition on mount
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-lg border shadow-md
        ${bg} ${border} ${text}
        transition-all duration-200 ease-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
      `}
      role={item.type === 'error' ? 'alert' : 'status'}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1 text-xs font-medium leading-relaxed break-words">
        {item.message}
      </span>
      <button
        onClick={onClose}
        className={`shrink-0 ${text} hover:opacity-70 transition-opacity cursor-pointer`}
        aria-label="ปิด"
      >
        <X size={14} />
      </button>
    </div>
  );
}
