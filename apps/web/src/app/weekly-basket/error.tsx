'use client';

type WeeklyBasketErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WeeklyBasketError({ error, reset }: WeeklyBasketErrorProps) {
  const message = error.message || 'The weekly basket optimizer could not load right now.';

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50/70 p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-800">Basket optimizer unavailable</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">We could not load this weekly basket</h1>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-700">{message}</p>
        <button
          className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
