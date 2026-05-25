'use client';

export default function ScreenerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-7xl">
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Screener interrupted</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">The grocery screener hit a runtime error</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            The screener could not finish loading the latest verified rows. Retry the route to rebuild the table without falling back to the generic app error.
          </p>
          {error.digest ? <p className="mt-3 text-xs font-bold text-rose-900">Error digest: {error.digest}</p> : null}
          <button className="mt-5 rounded-full bg-rose-900 px-5 py-3 text-sm font-black text-white shadow-sm" onClick={reset} type="button">
            Retry screener
          </button>
        </section>
      </main>
    </div>
  );
}
