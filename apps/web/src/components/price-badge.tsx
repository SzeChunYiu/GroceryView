import { getPriceFreshness } from "../lib/freshness";
import { classifyPriceVolatilityBadge, type PriceVolatilityBadge, type PriceVolatilityObservation } from "../lib/price-intelligence";

export interface PriceBadgeProps {
  price: number | string;
  scrapedAt?: string | number | Date | null;
  recentObservations?: ReadonlyArray<PriceVolatilityObservation>;
  volatilityBadge?: PriceVolatilityBadge | null;
  currency?: string;
  className?: string;
}

const freshnessStyles = {
  fresh: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aging: "border-amber-200 bg-amber-50 text-amber-700",
  stale: "border-red-200 bg-red-50 text-red-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

const volatilityStyles = {
  stable: "bg-slate-100 text-slate-700",
  rising: "bg-amber-100 text-amber-800",
  falling: "bg-emerald-100 text-emerald-800",
  volatile: "bg-fuchsia-100 text-fuchsia-800",
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

export function PriceBadge({ price, scrapedAt, recentObservations = [], volatilityBadge, currency = "SEK", className = "" }: PriceBadgeProps) {
  const freshness = getPriceFreshness(scrapedAt);
  const volatility = volatilityBadge ?? (recentObservations.length > 0 ? classifyPriceVolatilityBadge(recentObservations) : null);

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
      {volatility ? (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${volatilityStyles[volatility.kind]}`} title={volatility.description}>
          {volatility.label}
        </span>
      ) : null}
    </span>
  );
}

export default PriceBadge;
