import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { PriceChartPlaceholder } from "@/components/price-chart-placeholder";

const sekFormatter = new Intl.NumberFormat("sv-SE", {
  currency: "SEK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

const sourceTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});


type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

type PriceRow = {
  store: string;
  price: number;
  unitPrice: number;
  unit: string;
  priceType: "regular" | "promotion" | "member" | "estimated";
  sourceType: string;
  observedAt: string;
  confidence: "high" | "medium" | "low";
  label: string;
  note: string;
};

const priceRows: PriceRow[] = [
  {
    store: "Willys Odenplan",
    price: 49.9,
    unitPrice: 110.89,
    unit: "kg",
    priceType: "promotion",
    sourceType: "retailer_page",
    observedAt: "2026-05-16T09:30:00.000Z",
    confidence: "high",
    label: "Promo campaign",
    note: "Verified retailer page price. Never styled as the official shelf price unless the source is shelf-verified.",
  },
  {
    store: "ICA Kvantum Liljeholmen",
    price: 54.9,
    unitPrice: 122.0,
    unit: "kg",
    priceType: "regular",
    sourceType: "retailer_page",
    observedAt: "2026-05-16T08:45:00.000Z",
    confidence: "high",
    label: "Shelf price",
    note: "Visible with a shelf-price label and confidence badge.",
  },
  {
    store: "Coop Farsta",
    price: 57.9,
    unitPrice: 128.67,
    unit: "kg",
    priceType: "estimated",
    sourceType: "estimated",
    observedAt: "2026-05-15T17:20:00.000Z",
    confidence: "low",
    label: "Unverified / estimated",
    note: "Clearly marked as unverified so it cannot be mistaken for an official shelf price.",
  },
];

function formatSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productName = formatSlug(slug);
  const bestPrice = priceRows[0]!;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Product Price Terminal
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{productName}</h1>
        </div>
        <ConfidenceBadge level="medium" label="terminal placeholder" sampleSize={priceRows.length} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <PriceChartPlaceholder />

        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Current best price
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Best store</p>
              <p className="text-2xl font-semibold">{bestPrice.store}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500">Price</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {sekFormatter.format(bestPrice.price)}
                </p>
              </article>
              <article className="rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500">Unit price</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {sekFormatter.format(bestPrice.unitPrice)}/{bestPrice.unit}
                </p>
              </article>
            </div>
            <dl className="space-y-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Price type</dt>
                <dd className="font-semibold capitalize">{bestPrice.priceType}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Source type</dt>
                <dd className="font-semibold">{bestPrice.sourceType}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Source time</dt>
                <dd className="font-semibold">{sourceTimeFormatter.format(new Date(bestPrice.observedAt))}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Confidence</dt>
                <dd className="font-semibold capitalize">{bestPrice.confidence}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Label</dt>
                <dd className="font-semibold">{bestPrice.label}</dd>
              </div>
            </dl>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-100">
              Unverified or estimated prices are always labelled and visually separated from verified shelf prices.
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Store price sheet
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Every store with clear price trust labels</h2>
          </div>
          <Link className="text-sm font-semibold text-emerald-600" href="/weekly-basket">
            Add to weekly basket →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_1fr_1fr]">
            <span>Store</span>
            <span>Price</span>
            <span>Unit price</span>
            <span>Type</span>
            <span>Source time</span>
            <span>Trust</span>
          </div>
          {priceRows.map((row) => {
            const estimated = row.priceType === "estimated" || row.confidence === "low";
            const rowClass = estimated
              ? "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/25"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

            return (
              <article className={`grid gap-3 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_1fr_1fr] ${rowClass}`} key={`${row.store}-${row.priceType}`}>
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{row.store}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{row.note}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Price</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{sekFormatter.format(row.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Unit price</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {sekFormatter.format(row.unitPrice)}/{row.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Type</p>
                  <p className="mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200">
                    {row.priceType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Source time</p>
                  <p className="mt-1 text-sm font-semibold">
                    {sourceTimeFormatter.format(new Date(row.observedAt))}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-zinc-500">Trust</p>
                  <ConfidenceBadge
                    level={row.confidence}
                    label={estimated ? "estimated / unverified" : `${row.confidence} confidence`}
                    sampleSize={estimated ? undefined : 1}
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Source: {row.sourceType}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
