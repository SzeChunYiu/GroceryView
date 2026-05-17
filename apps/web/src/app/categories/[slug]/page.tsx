import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

function formatSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = formatSlug(slug);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ConfidenceBadge level="medium" label="category placeholder" sampleSize={42} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{categoryName} category pulse</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Category dashboards will compare product cohorts, promotion depth, and store-level dispersion once data ingestion is online.
        </p>
      </section>

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold">Placeholder leaderboard</h2>
        <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
          {[
            ["Milk 1L", "Willys", "13.90 kr"],
            ["Yogurt 1kg", "Lidl", "24.90 kr"],
            ["Cheese 500g", "Hemköp", "59.90 kr"],
          ].map(([product, store, price]) => (
            <Link
              className="grid gap-2 border-b border-zinc-200 px-5 py-4 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950 md:grid-cols-[1fr_0.5fr_0.5fr]"
              href={`/products/${product.toLowerCase().replaceAll(" ", "-")}`}
              key={product}
            >
              <span className="font-medium">{product}</span>
              <span className="text-zinc-500">{store}</span>
              <span className="font-semibold tabular-nums">{price}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
