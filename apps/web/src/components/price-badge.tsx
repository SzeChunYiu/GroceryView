import { getPriceFreshness } from "../lib/freshness";

export interface PriceBadgeProps {
  price: number | string;
  scrapedAt?: string | number | Date | null;
  currency?: string;
  className?: string;
  unitConfidence?: "exact" | "converted" | "estimated" | null;
  unitConfidenceLabel?: string | null;
}

const freshnessStyles = {
  fresh: "border-emerald-200 bg-emerald-50 text-emerald-700",
  aging: "border-amber-200 bg-amber-50 text-amber-700",
  stale: "border-red-200 bg-red-50 text-red-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

const unitConfidenceStyles = {
  exact: "bg-emerald-100 text-emerald-800",
  converted: "bg-sky-100 text-sky-800",
  estimated: "bg-amber-100 text-amber-800",
};

const unitConfidenceLabels = {
  exact: "Exact unit",
  converted: "Converted unit",
  estimated: "Estimated unit",
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

export function PriceBadge({
  price,
  scrapedAt,
  currency = "SEK",
  className = "",
  unitConfidence = null,
  unitConfidenceLabel = null,
}: PriceBadgeProps) {
  const freshness = getPriceFreshness(scrapedAt);
  const confidenceLabel = unitConfidence ? unitConfidenceLabel ?? unitConfidenceLabels[unitConfidence] : null;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
        freshnessStyles[freshness.level]
      } ${className}`.trim()}
      title={confidenceLabel ? `${freshness.refreshHint}. ${confidenceLabel}` : freshness.refreshHint}
      aria-label={`${formatPrice(price, currency)}. ${freshness.label}. ${freshness.refreshHint}${confidenceLabel ? `. ${confidenceLabel}` : ""}`}
    >
      <span>{formatPrice(price, currency)}</span>
      <span className="text-xs font-normal">{freshness.label}</span>
      {unitConfidence ? (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${unitConfidenceStyles[unitConfidence]}`}>
          {unitConfidenceLabels[unitConfidence]}
        </span>
      ) : null}
      {freshness.isStale ? <span className="text-xs font-semibold">Refresh price</span> : null}
    </span>
  );
}

export default PriceBadge;
