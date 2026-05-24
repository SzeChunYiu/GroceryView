export type PriceDisplayListing = {
  effectiveUnitPriceLabel?: string;
  effectiveUnitPrice?: number;
  listUnitPriceLabel?: string;
  listUnitPrice?: number;
  unit?: string;
  savingsVsList?: string | number;
};

export type PriceDisplayPromotion = {
  termsText?: string;
  bundlePriceLabel?: string;
  requiredQuantity?: number;
  eligibilityCaveats?: string[];
};

function priceLabel(value: number | undefined, unit = 'st') {
  if (value === undefined) return null;
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(value)} kr/${unit}`;
}

function savingsLabel(value: string | number | undefined) {
  if (value === undefined) return null;
  if (typeof value === 'string') return value;
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(value)} kr savings_vs_list`;
}

function promotionTerms(promotion?: PriceDisplayPromotion) {
  if (!promotion) return null;
  if (promotion.termsText) return promotion.termsText;
  if (promotion.bundlePriceLabel && promotion.requiredQuantity) {
    return `${promotion.bundlePriceLabel} — köp ${promotion.requiredQuantity}`;
  }
  return promotion.bundlePriceLabel ?? null;
}

export function PriceDisplay({
  listing,
  promotion
}: Readonly<{
  listing: PriceDisplayListing;
  promotion?: PriceDisplayPromotion;
}>) {
  const unit = listing.unit ?? 'st';
  const effective = listing.effectiveUnitPriceLabel ?? priceLabel(listing.effectiveUnitPrice, unit) ?? 'Pris saknas';
  const list = listing.listUnitPriceLabel ?? priceLabel(listing.listUnitPrice, unit);
  const savings = savingsLabel(listing.savingsVsList);
  const terms = promotionTerms(promotion);
  const caveats = promotion?.eligibilityCaveats ?? [];

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4" data-price-display="canonical">
      <p className="text-3xl font-black text-emerald-800">{effective}</p>
      {list ? (
        <p className="mt-1 text-sm font-semibold text-slate-600">
          <span className="line-through">{list}</span>
          {savings ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-emerald-900">{savings}</span> : null}
        </p>
      ) : null}
      {terms ? <p className="mt-2 text-sm font-black text-slate-950">{terms}</p> : null}
      {caveats.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-800">
          {caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
