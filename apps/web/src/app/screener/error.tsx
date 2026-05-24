'use client';

type ScreenerErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ScreenerError({ error, reset }: Readonly<ScreenerErrorProps>) {
  const message = error.message || 'Something went wrong loading the screener.';

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-red-700">Screener unavailable</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">We could not load the deal screener</h1>
        <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-slate-700">{message}</p>
        <button
          className="mt-5 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
