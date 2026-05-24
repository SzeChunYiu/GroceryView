import WatchlistPage from '../../watchlist/page';

export default function CountryWatchlistPage() {
  return (
    <>
      <section className="mx-auto mt-6 w-full max-w-7xl rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Price-drop target setup</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Set watchlist alert targets</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem_auto]" aria-label="Set watchlist price target">
          <label className="text-sm font-bold text-slate-700">
            Product or SKU
            <input className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" name="productId" placeholder="coffee" />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Target unit price
            <input className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" min="0" name="alertTarget" step="0.01" type="number" />
          </label>
          <button className="self-end rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" type="submit">Save target</button>
        </form>
        <p className="mt-3 text-sm font-semibold text-slate-600">Daily jobs compare current effective_unit_price to alert_target and send email plus PWA push when the target is met.</p>
      </section>
      <WatchlistPage />
    </>
  );
}
