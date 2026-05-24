'use client';

import { useEffect } from 'react';

type GlobalErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

function currentRoute() {
  if (typeof window === 'undefined') return 'server-render';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

async function reportClientError(error: Error) {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || 'Unhandled client error',
        stack: error.stack || '',
        route: currentRoute()
      }),
      keepalive: true
    });
  } catch {
    // The global error UI must stay usable even if reporting is blocked or offline.
  }
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    void reportClientError(error);
  }, [error]);

  return (
    <html lang="sv">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
          <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl shadow-black/30">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">GroceryView</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Something went wrong</h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-200">
              We could not render this page. The error was reported without adding any external tracking dependency.
            </p>
            <button
              className="mt-8 rounded-full bg-emerald-400 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-200/60"
              onClick={() => reset()}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
