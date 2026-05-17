import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

function formatSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const storeName = formatSlug(slug);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ConfidenceBadge level="high" label="store placeholder" sampleSize={24} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{storeName} store page</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Store-level dashboards will rank promotions, price volatility, and basket fit for Stockholm shoppers.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["Best deal", "Coffee 450g", "18% below typical"],
          ["Basket score", "82/100", "Strong pantry value"],
          ["Freshness", "Daily", "Awaiting ingestion SLA"],
        ].map(([label, value, note]) => (
          <article
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            key={label}
          >
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{note}</p>
          </article>
        ))}
      </section>

      <Link className="text-sm font-semibold text-emerald-600" href="/categories/dairy">
        Explore category comparisons →
      </Link>
    </div>
  );
}
