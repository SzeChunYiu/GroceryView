import { getPriceFreshness } from "../lib/freshness";

export interface PriceBadgeProps {
  price: number | string;
  scrapedAt?: string | number | Date | null;
  currency?: string;
  className?: string;
}

const freshnessStyles = {
  fresh: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aging: "border-amber-200 bg-amber-50 text-amber-700",
  stale: "border-red-200 bg-red-50 text-red-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

function formatPrice(price: number | string, currency: string) {
  if (typeof price !== "number") {
    return price;
  }

  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

export function PriceBadge({ price, scrapedAt, currency = "SEK", className = "" }: PriceBadgeProps) {
  const freshness = getPriceFreshness(scrapedAt);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
        freshnessStyles[freshness.level]
      } ${className}`.trim()}
      title={freshness.refreshHint}
      aria-label={`${formatPrice(price, currency)}. ${freshness.label}. ${freshness.refreshHint}`}
    >
      <span>{formatPrice(price, currency)}</span>
      <span className="text-xs font-normal">{freshness.label}</span>
      {freshness.isStale ? <span className="text-xs font-semibold">Refresh price</span> : null}
    </span>
  );
}

export default PriceBadge;
