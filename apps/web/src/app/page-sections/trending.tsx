import Link from 'next/link';
import { ArrowDownRight, BadgeCheck, Clock3 } from 'lucide-react';
import { buildCityPriceDropTrends, type CityPriceDropTrend } from '@/lib/trends';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

function confidenceClass(card: CityPriceDropTrend) {
  if (card.confidenceLabel === 'high') return 'bg-emerald-100 text-emerald-900';
  if (card.confidenceLabel === 'medium') return 'bg-cyan-100 text-cyan-950';
  return 'bg-amber-100 text-amber-950';
}

export function TrendingPriceDropCards({ city = 'stockholm' }: Readonly<{ city?: string }>) {
  const feed = buildCityPriceDropTrends({ city, limit: 4 });
  if (feed.cards.length === 0) return null;

  return (
    <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm" aria-label={`${feed.city} trending price drops`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Trending price drops</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Top drops in {feed.city}</h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">
          Ranked from latest dated observations against each product's prior different price; cards show delta, confidence, and urgency.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {feed.cards.map((card) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-700"
            data-trending-price-drop-card={card.rank}
            href={`/products/${card.productSlug}`}
            key={card.productSlug}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">#{card.rank} · {card.categoryLabel}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{card.productName}</h3>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{card.brand}</p>
              </div>
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-800" aria-label="Price dropped">
                <ArrowDownRight aria-hidden="true" size={20} strokeWidth={3} />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-slate-500">Now</p>
                <p className="mt-1 text-lg font-black text-slate-950">{formatSek(card.latestPrice)}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-bold text-slate-500">Drop</p>
                <p className="mt-1 text-lg font-black text-emerald-800">{formatSek(card.deltaAmount)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-black text-emerald-800">{formatPercent(card.deltaPercent)} from {formatSek(card.previousPrice)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${confidenceClass(card)}`}>
                <BadgeCheck aria-hidden="true" size={14} />
                {card.confidenceLabel} · {card.confidenceScore.toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700">
                <Clock3 aria-hidden="true" size={14} />
                {card.urgencyLabel}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              {card.confidenceDetail}; source {card.sourceLabel}.
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
