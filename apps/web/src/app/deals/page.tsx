import { DealCard } from '@/components/deal-card';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { buildLocalPriceDropFeed } from '@/lib/price-events';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/deals');
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

const localDropFeed = buildLocalPriceDropFeed(pricedProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brands,
  category: categoryLabels[product.category] ?? product.category,
  locality: 'Stockholm area',
  quantity: product.quantity,
  observations: product.observations
})), 8, 'Stockholm area');

export default function DealsPage() {
  return (
    <main className="bg-market-paper pb-16">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Local deal feed</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-market-ink md:text-5xl">Recent price drops near you</h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-market-ink/70">
                GroceryView ranks nearby products by recent percentage drops, then uses normalized unit-price savings to break ties so the feed favors meaningful basket savings.
              </p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950">
              Built from dated OpenPrices SEK observations for the local market. Cards show the latest observed price, the prior week comparison, and the per-unit drop, falling back to per-item savings when package size is unavailable.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Nearby products with recent price and unit-price drops" data-local-price-drop-feed>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Ranked savings</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-market-ink">Top local drops this week</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-market-ink/60">
            Ranking = biggest percentage drop first, followed by largest unit-price drop. No unobserved prices or retailer promotions are inferred.
          </p>
        </div>

        {localDropFeed.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {localDropFeed.map((item) => (
              <DealCard
                categoryLabel={item.category}
                currentPrice={item.latestPrice}
                dealId={`local-price-drop-${item.productSlug}`}
                discountStartedAt={item.latestObservedAt}
                dropPercentLabel={`${formatPercent(item.dropPercent)} drop`}
                evidenceLabel={`${item.evidenceLabel}. Unit price moved from ${formatSek(item.previousWeekUnitPrice)}/${item.unitPriceUnit} to ${formatSek(item.latestUnitPrice)}/${item.unitPriceUnit}.`}
                key={item.productSlug}
                localityLabel={item.locality}
                originalPrice={item.previousWeekPrice}
                priceHistory={[{ price: item.previousWeekPrice, observedAt: item.previousObservedAt }]}
                productHref={`/products/${item.productSlug}`}
                productId={item.productSlug}
                rankLabel={`#${item.rank}`}
                retailerName="OpenPrices"
                sharePath={`/products/${item.productSlug}`}
                title={item.productName}
                unitPriceDropLabel={`${formatSek(item.unitPriceDrop)}/${item.unitPriceUnit} unit drop`}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-market-ink/20 bg-white p-6 text-sm font-semibold text-market-ink/70">
            No week-over-week local price drops are available from the current dated observation snapshot.
          </div>
        )}
      </section>
    </main>
  );
}
