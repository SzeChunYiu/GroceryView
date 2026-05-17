import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const categoryLeaders = [
  { product: "Milk 1L", store: "Willys", signal: "Best median" },
  { product: "Oats 1kg", store: "Lidl", signal: "Stable low" },
  { product: "Greek yogurt", store: "Hemköp", signal: "Promo watch" },
];
type CategoryPageProps = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string) {
  return slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = titleFromSlug(slug) || "Category";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link className="text-sm font-semibold text-emerald-600" href="/">← Back to market overview</Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Category page placeholder</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{categoryName}</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">Placeholder category board for cross-store spreads, volatility, and best value products in the Stockholm grocery market.</p>
      </section>
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><h2 className="text-2xl font-semibold">Category leaders</h2><ConfidenceBadge level="medium" label="mock rankings" /></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {categoryLeaders.map((leader) => (<article className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-950" key={leader.product}><p className="text-sm font-semibold text-zinc-500">{leader.signal}</p><h3 className="mt-2 text-xl font-semibold">{leader.product}</h3><p className="mt-2 text-sm text-zinc-500">Observed at {leader.store}</p></article>))}
        </div>
      </section>
    </div>
  );
}
