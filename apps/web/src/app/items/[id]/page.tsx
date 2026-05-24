import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/lib/demo-data';
import { pricedProducts } from '@/lib/openprices-products';

import { itemDetailIdFor } from '@/lib/item-route';

const openPriceByCode = new Map(pricedProducts.map((p) => [p.code, p]));
const openPriceBySlug = new Map(pricedProducts.map((p) => [p.slug, p]));
const seenRouteIds = new Set([
  ...products.map((product) => itemDetailIdFor(product)),
  ...pricedProducts.map((product) => itemDetailIdFor(product)),
  ...pricedProducts.map((product) => itemDetailIdFor({ code: product.code, slug: product.slug }))
]);

export async function generateStaticParams() {
  const itemIds = [...seenRouteIds];
  return itemIds.map((id) => ({ id }));
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const openPrice = openPriceByCode.get(id) ?? openPriceBySlug.get(id);
  const demoProduct = products.find((product) => itemDetailIdFor(product) === id);

  if (!openPrice && !demoProduct) notFound();

  const idParts = openPrice
    ? [
        { label: 'EAN', value: openPrice.code },
        { label: 'Brand', value: openPrice.brands || 'Unknown' },
        { label: 'Category', value: categoryLabel(openPrice.category, openPrice.categories[0]) },
        { label: 'Quantity', value: openPrice.quantity || 'N/A' }
      ]
    : [
        { label: 'Source', value: demoProduct!.source },
        { label: 'Observed at', value: demoProduct!.observedAt },
        { label: 'Store', value: demoProduct!.store }
      ];

  const title = openPrice?.name ?? demoProduct!.name;
  const subtitle = openPrice ? openPrice.code : `Ticker ${demoProduct!.ticker}`;
  const itemPrice = openPrice ? `SEK ${openPrice.priceMedian.toFixed(2)}` : demoProduct!.price;
  const unitPrice = openPrice ? `SEK ${openPrice.priceMin.toFixed(2)} – SEK ${openPrice.priceMax.toFixed(2)}` : demoProduct!.unitPrice;
  const imageUrl = openPrice?.image ? (
    <img
      src={openPrice.image}
      alt={title}
      className="h-28 w-28 rounded-xl border border-market-ink/10 object-cover"
    />
  ) : null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <span className="text-sm font-semibold text-market-ink/70">{idParts[0]?.label}</span>
      </nav>

      <section className="rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight">{title}</h1>
            <p className="text-lg text-market-ink/65">SKU {itemPrice}</p>
            <p className="text-sm text-market-ink/65">Unit price benchmark: {unitPrice}</p>
            <p className="text-sm font-semibold uppercase tracking-wide text-market-ink/55">{subtitle}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Type" value={openPrice ? 'OpenPrices observation' : 'Demo product'} />
              <Metric label="Observation count" value={openPrice ? String(openPrice.observationCount) : '1'} />
              <Metric label="Confidence" value={openPrice ? 'Observed' : 'Reference'} />
            </div>
          </div>
          {imageUrl}
        </div>

        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          {idParts.map((item) => (
            <div key={item.label} className="rounded-md border border-market-ink/10 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-market-ink/55">{item.label}</dt>
              <dd className="mt-1 font-black">{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs text-market-ink/50">
          Linking uses stable IDs so /items pages can be deep-linked by OpenFoodFacts code or demo slugs.
        </p>
      </section>
    </main>
  );
}

type MetricItem = { label: string; value: string };

function Metric({ label, value }: Readonly<MetricItem>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <p className="text-xs font-semibold text-market-ink/55">{label}</p>
      <strong className="mt-1 block text-lg font-black">{value}</strong>
    </div>
  );
}

function categoryLabel(category: string, categoryHint: string | undefined) {
  return category ? category : categoryHint?.replace('en:', '')?.replace('sv:', '') ?? 'Uncategorized';
}
