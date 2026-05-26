'use client';

import { safeErrorMessage } from '@/lib/safe-errors';

type ScreenerErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ScreenerError({ error, reset }: Readonly<ScreenerErrorProps>) {
  const safeError = safeErrorMessage(error);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-red-700">Screener unavailable</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{safeError.title}</h1>
        <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-700">{safeError.userMessage}</p>
        <p className="mt-2 text-sm font-bold text-slate-500">Error category: {safeError.code}. {safeError.retryable ? 'Retry is safe.' : 'Retry will not help until the source or input changes.'}</p>
        <button
          className="mt-5 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"
          onClick={reset}
          type="button"
        >
          {safeError.actionLabel}
        </button>
      </section>
    </main>
  );
}
