'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

type ToastMessage = {
  id: number;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>');
  }
  return context;
}

function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-max max-w-[calc(100%-2rem)] flex-col-reverse gap-2 px-4"
      aria-live="polite"
      aria-label="Shopping list notifications"
    >
      {toasts.map((toast) => (
        <div
          className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald-900/10"
          key={toast.id}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timerById = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timerById.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timerById.current[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string) => {
      const id = Math.floor(performance.now() * 1000 + Math.random() * 1000);
      setToasts((current) => [...current, { id, message }]);
      timerById.current[id] = setTimeout(() => {
        dismissToast(id);
      }, 2500);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timerById.current).forEach((timer) => clearTimeout(timer));
      timerById.current = {};
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}
