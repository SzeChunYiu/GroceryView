import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { DealScoreCard } from "@/components/deal-score-card";

const pricePoints = [
  { store: "Willys", price: "13,90 kr", delta: "-15.8%" },
  { store: "ICA", price: "15,50 kr", delta: "-6.1%" },
  { store: "Coop", price: "16,90 kr", delta: "+2.4%" },
  { store: "Hemköp", price: "17,50 kr", delta: "+6.1%" },
];

type ProductPageProps = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string) {
  return slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productName = titleFromSlug(slug) || "Product";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-end">
        <div>
          <Link className="text-sm font-semibold text-emerald-600" href="/">← Back to market overview</Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Product Price Terminal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{productName}</h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">Placeholder detail view for a product slug. Historical price charts, store availability, and alerts will connect here after ingestion ships.</p>
        </div>
        <ConfidenceBadge level="medium" label="sample terminal" sampleSize={24} />
      </div>
      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <DealScoreCard productName={productName} storeName="Best current store" currentPrice={13.9} referencePrice={16.5} dealScore={86} confidence="medium" />
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-semibold">Store price ladder</h2>
          <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            {pricePoints.map((point) => (
              <div className="grid grid-cols-3 items-center gap-4 py-4" key={point.store}>
                <span className="font-semibold">{point.store}</span><span className="font-mono text-sm">{point.price}</span><span className="justify-self-end rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{point.delta}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">Chart module placeholder. The Lightweight Charts integration will mount here after the dedicated chart component task is complete.</div>
        </div>
      </section>
    </div>
  );
}
