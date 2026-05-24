export type RecommendationSignal = {
  label: string;
  value?: string | number;
  matched?: boolean;
};

export type WhyRecommendedProps = {
  ranker: string;
  signals: RecommendationSignal[];
  filteredOut?: string[];
  title?: string;
};

export function WhyRecommended({
  ranker,
  signals,
  filteredOut = [],
  title = 'Why we recommended this'
}: Readonly<WhyRecommendedProps>) {
  const matchedSignals = signals.filter((signal) => signal.matched !== false);
  const blockedSignals = signals.filter((signal) => signal.matched === false);

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm open:border-emerald-300 open:bg-emerald-50/40">
      <summary className="cursor-pointer list-none font-black text-slate-950 marker:hidden">
        <span className="inline-flex items-center gap-2">
          <span>{title}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-600">{ranker}</span>
        </span>
      </summary>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Ranker</h3>
          <p className="mt-2 font-semibold text-slate-700">{ranker}</p>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Signals matched</h3>
          {matchedSignals.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {matchedSignals.map((signal) => (
                <li className="rounded-xl bg-emerald-100 px-3 py-2 font-semibold text-emerald-950" key={`${signal.label}-${signal.value ?? 'matched'}`}>
                  {signal.label}{signal.value !== undefined ? `: ${signal.value}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-semibold text-slate-600">No positive signals were exposed by this ranker.</p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Filtered out</h3>
          {filteredOut.length > 0 || blockedSignals.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {blockedSignals.map((signal) => (
                <li className="rounded-xl bg-amber-100 px-3 py-2 font-semibold text-amber-950" key={`${signal.label}-${signal.value ?? 'blocked'}`}>
                  {signal.label}{signal.value !== undefined ? `: ${signal.value}` : ''}
                </li>
              ))}
              {filteredOut.map((reason) => (
                <li className="rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700" key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-semibold text-slate-600">No filtered-out signals were reported.</p>
          )}
        </section>
      </div>
    </details>
  );
}
