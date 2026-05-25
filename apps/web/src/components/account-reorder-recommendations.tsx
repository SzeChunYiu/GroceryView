import Link from 'next/link';

import { Card, Eyebrow } from '@/components/data-ui';
import { buildAccountReorderRecommendations } from '@/lib/personalization';

const signalLabels = {
  favorite: 'Favourite',
  watchlist: 'Watchlist',
  pantry: 'Pantry',
  recurring_list: 'Recurring list'
} as const;

export function AccountReorderRecommendations() {
  const recommendations = buildAccountReorderRecommendations();

  return (
    <Card className="mt-6 border-teal-200 bg-teal-50">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Eyebrow>Personalized reorder recommendations</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Likely repeat purchases before the next shop</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Ranked from favourites, watchlist, pantry, and recurring list signals. Rows stay account-scoped and show the evidence behind each restock suggestion.
          </p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-teal-900">{recommendations.length} reorder candidates</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {recommendations.map((recommendation) => (
          <Link className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm transition hover:border-teal-700" href={`/products/${recommendation.productId}`} key={recommendation.productId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">{recommendation.categoryLabel}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{recommendation.productName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">{recommendation.currentPriceLabel}</p>
              </div>
              <p className="rounded-2xl bg-teal-950 px-3 py-2 text-center text-sm font-black text-white">Score {recommendation.score}</p>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{recommendation.primaryReason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendation.evidenceSignals.map((signal) => (
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-950" key={signal}>{signalLabels[signal]}</span>
              ))}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{recommendation.confidenceLabel} confidence</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default AccountReorderRecommendations;
