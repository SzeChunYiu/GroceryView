import { ConfidenceBadge } from "./confidence-badge";

type ConfidenceLevel = "high" | "medium" | "low";

const sekFormatter = new Intl.NumberFormat("sv-SE", {
  currency: "SEK",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export type DealScoreCardProps = {
  productName: string;
  storeName: string;
  currentPrice: number;
  referencePrice: number;
  dealScore: number;
  confidence: ConfidenceLevel;
  trendLabel?: string;
};

export function DealScoreCard({
  productName,
  storeName,
  currentPrice,
  referencePrice,
  dealScore,
  confidence,
  trendLabel = "vs. 30-day median",
}: DealScoreCardProps) {
  const savings = referencePrice - currentPrice;
  const savingsPercent = referencePrice > 0 ? (savings / referencePrice) * 100 : 0;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(dealScore)));

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            {storeName}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            {productName}
          </h3>
        </div>
        <div className="rounded-2xl bg-zinc-950 px-3 py-2 text-center text-white dark:bg-zinc-50 dark:text-zinc-950">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
            Deal
          </p>
          <p className="text-2xl font-bold tabular-nums">{normalizedScore}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <p className="text-zinc-500">Today</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {sekFormatter.format(currentPrice)}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <p className="text-zinc-500">Typical</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {sekFormatter.format(referencePrice)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {savings >= 0 ? "Save" : "Above typical"} {sekFormatter.format(Math.abs(savings))}
          </span>{" "}
          ({Math.abs(savingsPercent).toFixed(1)}%) {trendLabel}
        </p>
        <ConfidenceBadge level={confidence} />
      </div>
    </article>
  );
}
