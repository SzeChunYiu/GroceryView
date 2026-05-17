import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const timeframes = ["1D", "7D", "30D", "90D", "1Y"];

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Product Price Terminal
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{productName}</h1>
        </div>
        <ConfidenceBadge level="medium" label="terminal placeholder" sampleSize={5} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <article className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-500">Historical price chart</p>
              <h2 className="text-2xl font-semibold">SEK trend placeholder</h2>
            </div>
            <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-950">
              {timeframes.map((timeframe) => (
                <button
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 first:bg-white first:text-zinc-950 first:shadow-sm dark:text-zinc-300 dark:first:bg-zinc-800 dark:first:text-white"
                  key={timeframe}
                  type="button"
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-80 items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            Lightweight Charts integration will render product history here after ingestion.
          </div>
        </article>

        <aside className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Store spread
          </p>
          <dl className="mt-5 space-y-4">
            {["Willys", "ICA", "Coop", "Hemköp", "Lidl"].map((store, index) => (
              <div className="flex items-center justify-between" key={store}>
                <dt className="text-zinc-600 dark:text-zinc-300">{store}</dt>
                <dd className="font-semibold tabular-nums">{(13.9 + index * 1.4).toFixed(2)} kr</dd>
              </div>
            ))}
          </dl>
          <Link className="mt-6 inline-flex text-sm font-semibold text-emerald-600" href="/weekly-basket">
            Add to weekly basket →
          </Link>
        </aside>
      </section>
    </div>
  );
}
