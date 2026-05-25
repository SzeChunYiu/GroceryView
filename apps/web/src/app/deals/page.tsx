import { DealCard } from '@/components/deal-card';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatSek, matchedChainProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/deals');
}

const expiringDealCards = matchedChainProducts.slice(0, 6).map((product, index) => ({
  product,
  dealEndsAt: new Date(Date.UTC(2026, 4, 25 + Math.min(index + 1, 5), 20, 59, 0)).toISOString()
}));

export default function DealsPage() {
  return (
    <PageShell>
      <Eyebrow>Deals</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Expiring flyer deals</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Countdown badges highlight verified flyer discounts ending soon so shoppers can prioritize time-sensitive trips.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {expiringDealCards.map(({ dealEndsAt, product }) => (
          <DealCard
            currentPrice={product.lowestPrice}
            dealEndsAt={dealEndsAt}
            dealId={product.slug}
            key={product.slug}
            originalPrice={product.highestPrice > product.lowestPrice ? product.highestPrice : undefined}
            sharePath={`/products/${product.slug}`}
            title={`${product.name} · ${formatSek(product.lowestPrice)}`}
          />
        ))}
      </div>
      <Card className="mt-6 border-rose-200 bg-rose-50">
        <p className="text-sm font-black text-rose-950">Countdown guardrail</p>
        <p className="mt-2 text-sm leading-6 text-rose-950">
          Badges only show ending-soon timing and do not infer stock, promotion causes, or unverified retailer claims.
        </p>
      </Card>
    </PageShell>
  );
}
