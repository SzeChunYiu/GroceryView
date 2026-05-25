'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useId, useState } from 'react';

export type ToastVariant = 'info' | 'success' | 'warn' | 'error';
type ToastTone = ToastVariant | 'warning';

export type ToastProps = {
  action?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  durationMs?: number;
  id?: string;
  message?: string;
  onClose?: () => void;
  open?: boolean;
  title: ReactNode;
  tone?: ToastTone;
  variant?: ToastVariant;
};

const toneClasses: Record<ToastTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-950 shadow-red-900/10',
  info: 'border-sky-200 bg-sky-50 text-sky-950 shadow-sky-900/10',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-900/10',
  warn: 'border-amber-200 bg-amber-50 text-amber-950 shadow-amber-900/10',
  warning: 'border-amber-200 bg-amber-50 text-amber-950 shadow-amber-900/10'
};

const toneLabels: Record<ToastTone, string> = {
  error: 'Error',
  info: 'Info',
  success: 'Success',
  warn: 'Warning',
  warning: 'Warning'
};

function ariaLiveFor(tone: ToastTone) {
  return tone === 'error' || tone === 'warn' || tone === 'warning' ? 'assertive' : 'polite';
}

function roleFor(tone: ToastTone) {
  return tone === 'error' || tone === 'warn' || tone === 'warning' ? 'alert' : 'status';
}

export function Toast({ action, children, description, durationMs = 5000, id, message, onClose, open = true, title, tone, variant = 'info' }: Readonly<ToastProps>) {
  const resolvedTone = tone ?? variant;
  const generatedId = useId();
  const titleId = `${id ?? generatedId}-title`;
  const descriptionId = description || message || children ? `${id ?? generatedId}-description` : undefined;
  const [visible, setVisible] = useState(open);

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

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeToast();
  }

  return (
    <article
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-live={ariaLiveFor(resolvedTone)}
      className={`rounded-3xl border p-4 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${toneClasses[resolvedTone]}`}
      onKeyDown={handleKeyDown}
      role={roleFor(resolvedTone)}
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">{toneLabels[resolvedTone]}</p>
          <p className="mt-1 text-sm font-black" id={titleId}>
            {title}
          </p>
          {description || message || children ? (
            <div className="mt-1 text-sm font-semibold leading-6 opacity-85" id={descriptionId}>
              {description ?? message ?? children}
            </div>
          ) : null}
        </div>
        {action}
        <button
          aria-label="Dismiss notification"
          className="rounded-full border border-current/20 px-2 py-1 text-sm font-black opacity-80 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          onClick={closeToast}
          type="button"
        >
          ×
        </button>
      </div>
    </article>
  );
}

export type ToastRegionProps = {
  children: ReactNode;
  label?: string;
};

export function ToastRegion({ children, label = 'Notifications' }: Readonly<ToastRegionProps>) {
  return (
    <section aria-label={label} className="fixed inset-x-3 bottom-3 z-50 mx-auto grid max-w-md gap-3" role="region">
      {children}
    </section>
  );
}
