import Link from 'next/link';
import { Card, PageShell } from '@/components/data-ui';
import { homepageAdaptiveProductCards } from '@/lib/verified-data';
import { buildPersonalizedRecommendationRail, defaultHouseholdId } from '@/lib/personalization';

export function PersonalizedRecommendations() {
  const recommendations = buildPersonalizedRecommendationRail(homepageAdaptiveProductCards, {
    favoriteBrands: ['Garant', 'Änglamark', 'Kaffe'],
    recentListActivity: ['coffee', 'milk', 'bread', 'fruit', 'watchlist', 'vegetarian'],
    limit: 4
  });

  return (
    <PageShell>
      <Card className="border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Personalized for {defaultHouseholdId}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Next likely grocery needs</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Ranked from favorites, watchlist signals, dietary preferences, and recent searches. The rail only links to verified product pages.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((product) => (
            <Link className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Score {product.score}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{product.brand || 'Brand not reported'} · {product.totalPriceLabel ?? 'price pending'}</p>
              <p className="mt-2 text-sm font-bold text-violet-900">{product.reason}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{product.sourceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
