'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function errorRoute() {
  if (typeof window === 'undefined') return 'server-render';
  return `${window.location.pathname}${window.location.search}`;
}

export default function GlobalError({ error, reset }: Readonly<GlobalErrorProps>) {
  useEffect(() => {
    const payload = {
      message: error.message || 'Unknown client error',
      stack: error.stack,
      route: errorRoute()
    };

    void fetch('/api/errors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {
      // Reporting must never block the recovery UI.
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">Application error</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Something went wrong</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
              The page could not continue. Retry the current view, or use navigation after the app reloads.
            </p>
            <button
              className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white"
              onClick={reset}
              type="button"
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
