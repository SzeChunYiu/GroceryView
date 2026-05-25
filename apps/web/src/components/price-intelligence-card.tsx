export interface PriceIntelligenceScoreCard {
  id: string;
  title: string;
  score: number;
  scoreLabel: string;
  actionLabel: string;
  windowLabel: string;
  trendSlopeLabel: string;
  volatilityLabel: string;
  forecastRangeLabel?: string;
  forecastConfidenceLabel?: string;
  forecastTrendLabel?: string;
  detail: string;
}

export interface PriceIntelligenceCardProps {
  cards: PriceIntelligenceScoreCard[];
  emptyState?: string;
  summary?: string;
  title?: string;
}

export interface BestTimeForecastPanelProps {
  confidenceLabel: string;
  expectedMovementLabel: string;
  guidance: string;
  headline: string;
  recommendationCount: number;
}

export function BestTimeForecastPanel({ confidenceLabel, expectedMovementLabel, guidance, headline, recommendationCount }: BestTimeForecastPanelProps) {
  return (
    <section className="mt-6 rounded-[2rem] border border-sky-200 bg-sky-50/90 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-800">Best time to buy forecast</p>
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">{headline}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{guidance}</p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900">{recommendationCount} scored items</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">Confidence: {confidenceLabel}</p>
        <p className="rounded-2xl bg-white/85 p-4 text-sm font-bold text-slate-700">{expectedMovementLabel}</p>
      </div>
    </section>
  );
}

export function PriceIntelligenceCard({
  cards,
  emptyState = 'Not enough dated price observations exist to score likely buying windows.',
  summary = 'Scores combine recent trend slope with observed volatility; they are decision aids, not price guarantees.',
  title = 'Best-time-to-buy score cards'
}: PriceIntelligenceCardProps) {
  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Price intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{summary}</p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900">{cards.length} scored window{cards.length === 1 ? '' : 's'}</p>
      </div>

      {cards.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {cards.map((card) => (
            <article className="rounded-2xl bg-white/90 p-4 shadow-sm" key={card.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{card.actionLabel}</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-950">{card.title}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-600">{card.windowLabel}</p>
                </div>
                <div className="rounded-2xl bg-emerald-950 px-3 py-2 text-center text-white">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-200">score</p>
                  <p className="text-2xl font-black">{card.score}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-black text-slate-800">{card.scoreLabel}</p>
              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600">
                <p className="rounded-xl bg-emerald-50 p-3">trend slope: {card.trendSlopeLabel}</p>
                <p className="rounded-xl bg-slate-50 p-3">volatility: {card.volatilityLabel}</p>
              </div>
              {card.forecastRangeLabel ? (
                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs font-bold text-sky-950">
                  <p className="uppercase tracking-[0.14em] text-sky-700">7-day forecast range</p>
                  <p className="mt-1 text-sm font-black">{card.forecastRangeLabel}</p>
                  <p className="mt-1 text-sky-800">{card.forecastConfidenceLabel ?? 'forecast confidence unavailable'}</p>
                  {card.forecastTrendLabel ? <p className="mt-1 text-sky-800">{card.forecastTrendLabel}</p> : null}
                </div>
              ) : null}
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{card.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-white/85 p-4 text-sm font-bold text-amber-950">{emptyState}</p>
      )}
    </section>
  );
}

export default PriceIntelligenceCard;
