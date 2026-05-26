import type { BackInStockAvailability } from '@groceryview/db';

type BackInStockBannerAvailability = Pick<
  BackInStockAvailability,
  'chainName' | 'currency' | 'currentObservedAt' | 'previousOutOfStockAt' | 'price' | 'storeName'
>;

type BackInStockBannerProps = {
  availability: BackInStockBannerAvailability | null;
};

function formatObservedDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(parsed);
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat('sv-SE', {
    currency,
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

export function BackInStockBanner({ availability }: BackInStockBannerProps) {
  if (!availability) return null;

  return (
    <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950" aria-live="polite">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black">Back in stock at {availability.storeName}</p>
          <p className="text-xs font-semibold text-emerald-800">
            Previously unavailable on {formatObservedDate(availability.previousOutOfStockAt)}; latest available signal from {availability.chainName} was observed {formatObservedDate(availability.currentObservedAt)}.
          </p>
        </div>
        <p className="text-sm font-black">{formatPrice(availability.price, availability.currency)}</p>
      </div>
    </section>
  );
}
