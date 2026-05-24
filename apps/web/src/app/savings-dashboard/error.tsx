'use client';

export default function SavingsDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-700">Savings dashboard unavailable</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">We could not load this dashboard.</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
          {error.message || 'An unexpected error interrupted the savings dashboard.'}
        </p>
        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
