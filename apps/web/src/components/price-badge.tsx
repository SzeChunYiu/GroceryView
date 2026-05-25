import { getPriceFreshness } from "../lib/freshness";
import type { RecentPriceVarianceBadge } from "../lib/price-intelligence";

export interface PriceBadgeProps {
  price: number | string;
  scrapedAt?: string | number | Date | null;
  currency?: string;
  className?: string;
  varianceBadge?: RecentPriceVarianceBadge | null;
}

const freshnessStyles = {
  fresh: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aging: "border-amber-200 bg-amber-50 text-amber-700",
  stale: "border-red-200 bg-red-50 text-red-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

const varianceStyles: Record<RecentPriceVarianceBadge["status"], string> = {
  stable: "bg-sky-100 text-sky-800",
  volatile: "bg-orange-100 text-orange-900",
  "likely-promo": "bg-emerald-100 text-emerald-900",
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

export function PriceBadge({ price, scrapedAt, currency = "SEK", className = "", varianceBadge }: PriceBadgeProps) {
  const freshness = getPriceFreshness(scrapedAt);
  const formattedPrice = formatPrice(price, currency);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
        freshnessStyles[freshness.level]
      } ${className}`.trim()}
      title={varianceBadge ? `${varianceBadge.summary} ${freshness.refreshHint}` : freshness.refreshHint}
      aria-label={`${formattedPrice}. ${freshness.label}. ${varianceBadge ? `${varianceBadge.label}, ${varianceBadge.score} of 100 variance score. ` : ''}${freshness.refreshHint}`}
    >
      <span>{formattedPrice}</span>
      <span className="text-xs font-normal">{freshness.label}</span>
      {varianceBadge ? (
        <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.12em] ${varianceStyles[varianceBadge.status]}`}>
          {varianceBadge.shortLabel}
        </span>
      ) : null}
      {freshness.isStale ? <span className="text-xs font-semibold">Refresh price</span> : null}
    </span>
  );
}

export default PriceBadge;
