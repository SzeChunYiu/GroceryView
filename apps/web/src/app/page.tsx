import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { DealScoreCard } from "@/components/deal-score-card";

const marketStats = [
  { label: "Tracked stores", value: "5 chains", detail: "ICA, Willys, Coop, Hemköp, Lidl" },
  { label: "Basket movement", value: "-3.4%", detail: "vs. last week placeholder" },
  { label: "Fresh deals", value: "42", detail: "candidate price drops today" },
];

const watchlist = [
  { name: "Milk 1.5% 1L", store: "Willys", price: "13,90 kr", href: "/products/milk" },
  { name: "Bananas loose", store: "ICA", price: "22,95 kr/kg", href: "/products/bananas" },
  { name: "Coffee 450g", store: "Coop", price: "49,90 kr", href: "/products/coffee" },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.5fr_1fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Today&apos;s Stockholm market overview</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Grocery price intelligence before you shop.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">Placeholder terminal for monitoring store-level prices, weekly basket drift, and deal confidence until live ingestion is connected.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" href="/weekly-basket">View weekly basket</Link>
              <Link className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-white dark:hover:text-white" href="/products/milk">Open product terminal</Link>
            </div>
          </div>
          <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-inner dark:bg-black">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">Live status</p>
            <div className="mt-6 space-y-4">
              {marketStats.map((stat) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4" key={stat.label}>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-sm text-zinc-300">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3" aria-label="Deal score previews">
        <DealScoreCard productName="Arla Mellanmjölk 1L" storeName="Willys Fridhemsplan" currentPrice={13.9} referencePrice={16.5} dealScore={86} confidence="medium" />
        <DealScoreCard productName="Zoégas Skånerost 450g" storeName="Coop Odenplan" currentPrice={49.9} referencePrice={62.9} dealScore={78} confidence="low" />
        <DealScoreCard productName="Bananer lösvikt" storeName="ICA Kvantum Liljeholmen" currentPrice={22.95} referencePrice={24.95} dealScore={64} confidence="high" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Watchlist</p><h2 className="mt-2 text-2xl font-semibold">Products to verify next</h2></div>
            <ConfidenceBadge level="medium" label="placeholder data" />
          </div>
          <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            {watchlist.map((item) => (
              <Link className="flex items-center justify-between gap-4 py-4 transition hover:text-emerald-600 dark:hover:text-emerald-400" href={item.href} key={item.name}>
                <span><span className="block font-semibold">{item.name}</span><span className="text-sm text-zinc-500">Best observed at {item.store}</span></span>
                <span className="font-mono text-sm font-semibold">{item.price}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Coverage roadmap</p>
          <h2 className="mt-2 text-2xl font-semibold">Market shell ready for ingestion</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["ICA", "Willys", "Coop", "Hemköp", "Lidl", "Stockholm categories"].map((label) => (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950" key={label}>
                <p className="font-semibold">{label}</p><p className="mt-1 text-sm text-zinc-500">Placeholder route and data slot</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
