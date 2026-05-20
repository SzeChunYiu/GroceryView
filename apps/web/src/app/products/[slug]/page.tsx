<<<<<<< HEAD
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/lib/demo-data';

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Product terminal</div>
        <h1 className="mt-3 text-4xl font-black">{product.ticker}</h1>
        <p className="mt-2 text-market-ink/65">{product.name}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Current price" value={product.price} />
          <Metric label="Unit price" value={product.unitPrice} />
          <Metric label="Store" value={product.store} />
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Metadata label="Price type" value={product.priceType} />
          <Metadata label="Confidence" value={product.confidence} />
          <Metadata label="Source timestamp" value={product.observedAt} />
          <Metadata label="Source type" value={product.source} />
        </dl>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs font-semibold text-market-ink/55">{label}</span>
    </div>
  );
}

function Metadata({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md border border-market-ink/10 p-3">
      <dt className="font-semibold text-market-ink/55">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
=======
import Link from "next/link";
import { explainDealScore } from "@groceryview/core";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { ProductPriceChart } from "@/components/product-price-chart";

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

type PriceSourceType = "retailer_page" | "shelf_photo" | "manual_admin" | "estimated";
type PriceRow = {
  store: string;
  price: number;
  unitPrice: number;
  unit: string;
  priceType: "regular" | "promotion" | "member" | "estimated";
  sourceType: PriceSourceType;
  sourceUrl: string;
  parserVersion: string;
  observedAt: string;
  confidence: "verified" | "high" | "medium" | "low" | "estimated";
  label: string;
  note: string;
  memberOnly: boolean;
  promotionLabel: string | null;
};

type PriceConfidence = PriceRow["confidence"];

type ConfidenceBadgeLevel = "high" | "medium" | "low";

const priceRows: PriceRow[] = [
  {
    store: "Willys Odenplan",
    price: 49.9,
    unitPrice: 110.89,
    unit: "kg",
    priceType: "promotion",
    sourceType: "retailer_page",
    sourceUrl: "https://example.retailer.se/prices/willys-odenplan/mjolk",
    parserVersion: "willys-pricing-v1.2.1",
    observedAt: "2026-05-16T09:30:00.000Z",
    confidence: "verified",
    label: "Promo campaign",
    note: "Verified retailer page price. Never styled as the official shelf price unless the source is shelf-verified.",
    memberOnly: false,
    promotionLabel: "3 for 2L",
  },
  {
    store: "ICA Kvantum Liljeholmen",
    price: 54.9,
    unitPrice: 122.0,
    unit: "kg",
    priceType: "regular",
    sourceType: "retailer_page",
    sourceUrl: "https://example.retailer.se/prices/ica-kvartum-liljeholmen/mjolk",
    parserVersion: "ica-pricing-v2.0.0",
    observedAt: "2026-05-16T08:45:00.000Z",
    confidence: "high",
    label: "Shelf price",
    note: "Visible with a shelf-price label and confidence badge.",
    memberOnly: false,
    promotionLabel: null,
  },
  {
    store: "Coop Farsta",
    price: 57.9,
    unitPrice: 128.67,
    unit: "kg",
    priceType: "estimated",
    sourceType: "estimated",
    sourceUrl: "https://internal/estimation/mjolk/farsta",
    parserVersion: "estimator-heuristic-v0.8.4",
    observedAt: "2026-05-15T17:20:00.000Z",
    confidence: "estimated",
    label: "Unverified / estimated",
    note: "Clearly marked as unverified so it cannot be mistaken for an official shelf price.",
    memberOnly: false,
    promotionLabel: null,
  },
  {
    store: "Hemkop T-Centralen",
    price: 46.9,
    unitPrice: 104.11,
    unit: "kg",
    priceType: "member",
    sourceType: "manual_admin",
    sourceUrl: "https://internal/admin/pricing/hemkop-t-centralen/mjolk",
    parserVersion: "ops-manual-log-v1.0.0",
    observedAt: "2026-05-14T12:18:00.000Z",
    confidence: "medium",
    label: "Member-only",
    note: "Requires loyalty context and cannot be treated as public shelf price.",
    memberOnly: true,
    promotionLabel: null,
  },
];

const officialPriceSources = new Set<PriceSourceType>(["retailer_page", "shelf_photo"]);

const trustStyles = {
  official: {
    row: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    label: "Official shelf price",
    summary: "Verified shelf source at high confidence.",
    badge: "bg-emerald-600 hover:bg-emerald-500",
    badgeLabel: "verified",
  },
  promotion: {
    row: "border-blue-200 bg-blue-50/65 dark:border-blue-900/45 dark:bg-blue-950/30",
    label: "Promotion / flyer",
    summary: "Valid price but from a temporary campaign.",
    badge: "bg-blue-600 hover:bg-blue-500",
    badgeLabel: "promo",
  },
  member: {
    row: "border-violet-200 bg-violet-50/65 dark:border-violet-900/45 dark:bg-violet-950/30",
    label: "Member-only",
    summary: "Likely inapplicable unless logged in as member.",
    badge: "bg-violet-600 hover:bg-violet-500",
    badgeLabel: "member",
  },
  estimated: {
    row: "border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/25",
    label: "Unverified / estimated",
    summary: "Estimated fallback. Never shown as official shelf price.",
    badge: "bg-amber-600 hover:bg-amber-500",
    badgeLabel: "estimated",
  },
  low: {
    row: "border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30",
    label: "Low confidence",
    summary: "Signal exists but confidence is low.",
    badge: "bg-rose-600 hover:bg-rose-500",
    badgeLabel: "low",
  },
} as const;

type TrustTone = keyof typeof trustStyles;

function priceTrustTone(row: PriceRow): TrustTone {
  if (officialPriceSources.has(row.sourceType) && row.priceType === "regular" && row.confidence !== "low") {
    return "official";
  }
  if (row.priceType === "member") {
    return "member";
  }
  if (row.priceType === "promotion") {
    return "promotion";
  }
  if (row.confidence === "low" || row.confidence === "estimated") {
    return row.confidence === "low" ? "low" : "estimated";
  }
  return "estimated";
}

function displayPriceType(row: PriceRow) {
  if (row.priceType === "member") {
    return "Member";
  }
  if (row.priceType === "promotion") {
    return "Promo";
  }
  return row.priceType === "estimated" ? "Estimated" : "Shelf";
}

function toBadgeLevel(confidence: PriceConfidence): ConfidenceBadgeLevel {
  if (confidence === "verified") {
    return "high";
  }
  if (confidence === "estimated") {
    return "low";
  }
  return confidence;
}

function formatSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSourceType(sourceType: PriceSourceType) {
  return sourceType.split("_").join(" ");
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productName = formatSlug(slug);
  const sortedForBest = [...priceRows].sort((left, right) => {
    const leftTone = priceTrustTone(left);
    const rightTone = priceTrustTone(right);
    const priority: Record<TrustTone, number> = {
      official: 0,
      promotion: 2,
      member: 3,
      low: 4,
      estimated: 5,
    };

    const toneDelta = priority[leftTone] - priority[rightTone];
    if (toneDelta !== 0) {
      return toneDelta;
    }
    return left.price - right.price;
  });
  const bestPrice = sortedForBest[0]!;
  const bestPriceTone = priceTrustTone(bestPrice);
  const bestIsVerified = bestPriceTone === "official";
  const dealExplanation = explainDealScore({
    currentCityPercentile: 8,
    knownPromoHistoryPercentile: 12,
    equivalentUnitPricePercentile: 18,
    discountDepthPercent: 25,
    sourceConfidence: bestPrice.confidence === "verified" ? 0.95 : bestPrice.confidence === "high" ? 0.85 : 0.55,
  });

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
        <ProductPriceChart />

        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Current best price
          </p>
          {!bestIsVerified ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/70 dark:text-amber-100">
              Best price is unverified or temporary. It is presented for comparison only and is
              explicitly separated from verified shelf prices.
            </p>
          ) : null}
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
                <dd className="font-semibold">{displayPriceType(bestPrice)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Source type</dt>
                <dd className="font-semibold capitalize">{bestPrice.sourceType.replace("_", " ")}</dd>
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
                <dd className="font-semibold">{trustStyles[bestPriceTone].label}</dd>
              </div>
              {bestPrice.promotionLabel ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-zinc-500">Promo</dt>
                  <dd className="font-semibold">{bestPrice.promotionLabel}</dd>
                </div>
              ) : null}
              {bestPrice.memberOnly ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-zinc-500">Member</dt>
                  <dd className="font-semibold">Yes</dd>
                </div>
              ) : null}
            </dl>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
              {trustStyles[bestPriceTone].summary}
            </div>
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    Deal score
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                    {dealExplanation.score}/100
                  </p>
                </div>
                <div className="rounded-full bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">
                  {dealExplanation.band.verdict}
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">{dealExplanation.summary}</p>
              <dl className="mt-4 space-y-2 text-sm">
                {dealExplanation.factors.slice(0, 3).map((factor) => (
                  <div className="flex items-center justify-between gap-3" key={factor.key}>
                    <dt className="text-zinc-600 dark:text-zinc-300">{factor.label}</dt>
                    <dd className="font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      +{factor.contribution}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
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
            const tone = priceTrustTone(row);
            const rowClass = `${trustStyles[tone].row} border-zinc-200`;

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
                  <p
                    className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200 ${trustStyles[tone].badge}`}
                    style={{ color: "#fff" }}
                  >
                    {displayPriceType(row)}
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
                    level={toBadgeLevel(row.confidence)}
                    label={trustStyles[tone].label}
                    sampleSize={undefined}
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Source: {row.sourceType}</p>
                  {row.promotionLabel ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Promo: {row.promotionLabel}</p>
                  ) : null}
                  {row.memberOnly ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Member-only price</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
>>>>>>> ec0cb15 (fix: restore release validation gate)
    </div>
  );
}
