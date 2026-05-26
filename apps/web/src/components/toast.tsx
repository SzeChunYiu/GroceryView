'use client';

import { useEffect, useState } from 'react';
import { Toast, ToastRegion, type ToastVariant } from './toast';

export const LIST_TOAST_EVENT = 'groceryview:list-toast';

type ListToastDetail = {
  id?: string;
  message?: string;
  title: string;
  variant?: ToastVariant;
};

type ActiveToast = Required<Pick<ListToastDetail, 'id' | 'title'>> & Pick<ListToastDetail, 'message' | 'variant'>;

export function dispatchListToast(detail: ListToastDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ListToastDetail>(LIST_TOAST_EVENT, { detail }));
}

export function ListToastViewport() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ListToastDetail>).detail;
      if (!detail?.title) return;
      const toast = {
        id: detail.id ?? `${Date.now()}:${Math.random().toString(36).slice(2)}`,
        title: detail.title,
        message: detail.message,
        variant: detail.variant ?? 'success'
      };
      setToasts((current) => [...current.slice(-2), toast]);
    }

    window.addEventListener(LIST_TOAST_EVENT, onToast);
    return () => window.removeEventListener(LIST_TOAST_EVENT, onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <ToastRegion label="Shopping list notifications">
      {toasts.map((toast) => (
        <Toast
          id={toast.id}
          key={toast.id}
          message={toast.message}
          onClose={() => setToasts((current) => current.filter((candidate) => candidate.id !== toast.id))}
          title={toast.title}
          variant={toast.variant}
        />
      ))}
    </ToastRegion>
  );
}
