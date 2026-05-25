'use client';

import { useEffect, useState } from 'react';

export type ToastVariant = 'info' | 'success' | 'warn' | 'error';

export interface ToastProps {
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
  open?: boolean;
  onClose?: () => void;
}

const variantStyles: Record<ToastVariant, { shell: string; dot: string; label: string }> = {
  info: {
    shell: 'border-sky-200 bg-sky-50 text-sky-950',
    dot: 'bg-sky-500',
    label: 'Info'
  },
  success: {
    shell: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    dot: 'bg-emerald-500',
    label: 'Success'
  },
  warn: {
    shell: 'border-amber-200 bg-amber-50 text-amber-950',
    dot: 'bg-amber-500',
    label: 'Warning'
  },
  error: {
    shell: 'border-rose-200 bg-rose-50 text-rose-950',
    dot: 'bg-rose-500',
    label: 'Error'
  }
};

export function Toast({ title, message, variant = 'info', durationMs = 5000, open = true, onClose }: ToastProps) {
  const [visible, setVisible] = useState(open);
  const styles = variantStyles[variant];

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!visible || durationMs <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose, visible]);

  if (!visible) return null;

  function closeToast() {
    setVisible(false);
    onClose?.();
  }

  return (
    <div className={`flex w-full max-w-md items-start gap-3 rounded-2xl border p-4 shadow-lg ${styles.shell}`} role="status" aria-live="polite">
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">{styles.label}</p>
        <p className="mt-1 text-sm font-black">{title}</p>
        {message ? <p className="mt-1 text-sm font-semibold leading-6 opacity-80">{message}</p> : null}
      </div>
      <button className="rounded-full px-2 py-1 text-sm font-black opacity-70 hover:bg-white/70 hover:opacity-100" onClick={closeToast} type="button" aria-label="Close notification">
        ×
      </button>
    </div>
  );
}
