import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { DealScoreCard } from "@/components/deal-score-card";

const marketSignals = [
  { label: "Tracked stores", value: "5", note: "ICA, Willys, Coop, Hemköp, Lidl" },
  { label: "Basket delta", value: "-3.8%", note: "vs. last week placeholder" },
  { label: "Deal alerts", value: "12", note: "ready for notification rules" },
];

const watchlist = [
  { product: "Arla milk 1L", store: "Willys", price: "13.90 kr", trend: "Near 30-day low" },
  { product: "Bananas 1kg", store: "ICA", price: "22.95 kr", trend: "Stable" },
  { product: "Coffee 450g", store: "Coop", price: "54.90 kr", trend: "Promo candidate" },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10">
      <section className="grid gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <ConfidenceBadge level="high" label="market overview shell" sampleSize={5} />
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-6xl">
            Today&apos;s Stockholm grocery market at a glance.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Compare price movements, surface basket savings, and prepare alerts before live ingestion connects historical store data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              href="/products/arla-milk-1l"
            >
              Open product terminal
            </Link>
            <Link
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-200"
              href="/weekly-basket"
            >
              View weekly basket
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          {marketSignals.map((signal) => (
            <article
              className="rounded-3xl bg-zinc-50 p-5 dark:bg-zinc-950"
              key={signal.label}
            >
              <p className="text-sm font-medium text-zinc-500">{signal.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{signal.value}</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{signal.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <DealScoreCard
          productName="Arla milk 1L"
          storeName="Willys"
          currentPrice={13.9}
          referencePrice={16.5}
          dealScore={84}
          confidence="medium"
        />

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Watchlist
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Price radar</h2>
            </div>
            <Link className="text-sm font-semibold text-emerald-600" href="/budget">
              Budget tracker →
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
            {watchlist.map((item) => (
              <Link
                className="grid gap-2 border-b border-zinc-200 px-5 py-4 transition last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950 md:grid-cols-[1fr_0.5fr_0.5fr_0.8fr]"
                href={`/products/${item.product.toLowerCase().replaceAll(" ", "-")}`}
                key={`${item.product}-${item.store}`}
              >
                <span className="font-medium">{item.product}</span>
                <span className="text-zinc-500">{item.store}</span>
                <span className="font-semibold tabular-nums">{item.price}</span>
                <span className="text-zinc-500">{item.trend}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
