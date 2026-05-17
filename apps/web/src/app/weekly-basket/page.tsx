import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const basketItems = [
  ["Dairy", "Milk, yogurt, cheese", "98.70 kr"],
  ["Produce", "Bananas, carrots, apples", "76.40 kr"],
  ["Pantry", "Coffee, pasta, rice", "151.80 kr"],
];

export default function WeeklyBasketPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ConfidenceBadge level="medium" label="weekly basket placeholder" sampleSize={12} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Weekly Basket</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Plan a representative Stockholm grocery basket and compare estimated totals by store before real basket optimization ships.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-semibold">Basket composition</h2>
          <div className="mt-5 space-y-3">
            {basketItems.map(([category, products, price]) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-zinc-50 p-5 dark:bg-zinc-950"
                key={category}
              >
                <div>
                  <p className="font-semibold">{category}</p>
                  <p className="mt-1 text-sm text-zinc-500">{products}</p>
                </div>
                <p className="font-semibold tabular-nums">{price}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Best current total</p>
          <p className="mt-4 text-5xl font-semibold tabular-nums">326.90 kr</p>
          <p className="mt-3 text-zinc-500">Willys placeholder basket, 4.6% below market median.</p>
          <Link className="mt-8 inline-flex text-sm font-semibold text-emerald-600" href="/stores/willys">
            Inspect store mix →
          </Link>
        </aside>
      </section>
    </div>
  );
}
