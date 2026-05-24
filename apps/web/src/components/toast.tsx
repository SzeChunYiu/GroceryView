'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'info' | 'success' | 'warn' | 'error';

export interface ToastProps {
  title?: string;
  message: ReactNode;
  variant?: ToastVariant;
  autoDismiss?: boolean;
  durationMs?: number;
  open?: boolean;
  action?: ReactNode;
  closeLabel?: string;
  className?: string;
  onClose?: () => void;
}

const variantStyles: Record<ToastVariant, {
  container: string;
  icon: string;
  eyebrow: string;
  glyph: string;
}> = {
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-950 shadow-sky-900/10',
    icon: 'bg-sky-500 text-white',
    eyebrow: 'text-sky-700',
    glyph: 'i'
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-900/10',
    icon: 'bg-emerald-600 text-white',
    eyebrow: 'text-emerald-700',
    glyph: '✓'
  },
  warn: {
    container: 'border-amber-200 bg-amber-50 text-amber-950 shadow-amber-900/10',
    icon: 'bg-amber-500 text-white',
    eyebrow: 'text-amber-800',
    glyph: '!'
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-950 shadow-rose-900/10',
    icon: 'bg-rose-600 text-white',
    eyebrow: 'text-rose-700',
    glyph: '×'
  }
};

const variantLabel: Record<ToastVariant, string> = {
  info: 'Info',
  success: 'Success',
  warn: 'Warning',
  error: 'Error'
};

export function Toast({
  title,
  message,
  variant = 'info',
  autoDismiss = true,
  durationMs = 5000,
  open = true,
  action,
  closeLabel = 'Dismiss notification',
  className,
  onClose
}: ToastProps) {
  const [visible, setVisible] = useState(open);
  const styles = variantStyles[variant];

  useEffect(() => {
    setVisible(open);
  }, [open, message, title, variant]);

  useEffect(() => {
    if (!visible || !autoDismiss || durationMs <= 0) return undefined;
    const timeout = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, durationMs);

    return () => window.clearTimeout(timeout);
  }, [autoDismiss, durationMs, onClose, visible]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <aside
      className={cn(
        'pointer-events-auto relative flex w-full max-w-md gap-3 overflow-hidden rounded-2xl border p-4 pr-3 shadow-xl backdrop-blur',
        'before:absolute before:inset-x-5 before:top-0 before:h-1 before:rounded-b-full before:bg-current before:opacity-20',
        styles.container,
        className
      )}
      role={variant === 'error' || variant === 'warn' ? 'alert' : 'status'}
      aria-live={variant === 'error' || variant === 'warn' ? 'assertive' : 'polite'}
    >
      <span
        className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-sm', styles.icon)}
        aria-hidden="true"
      >
        {styles.glyph}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('text-xs font-black uppercase tracking-[0.2em]', styles.eyebrow)}>{variantLabel[variant]}</p>
        {title ? <h2 className="mt-1 text-base font-black leading-tight tracking-tight">{title}</h2> : null}
        <div className="mt-1 text-sm leading-6 opacity-90">{message}</div>
        {action ? <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold">{action}</div> : null}
      </div>

      <button
        type="button"
        onClick={handleClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/15 bg-white/55 text-lg leading-none opacity-70 transition hover:scale-105 hover:bg-white hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label={closeLabel}
      >
        ×
      </button>
    </aside>
  );
}

export default Toast;
