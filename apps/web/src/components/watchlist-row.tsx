/**
 * Renders a single saved watchlist item row with its display details and row-level actions.
 *
 * @example
 * ```tsx
 * <WatchlistRow name="Organic Bananas" price="$0.69/lb" store="Fresh Market" />
 * ```
 *
 * @param props - Watchlist row display options.
 * @param props.name - Name of the watched grocery item.
 * @param props.price - Formatted price text shown for the watched item.
 * @param props.store - Store or source associated with the watched item.
 */
export interface Props {
  name: string;
  price: string;
  store: string;
  volatilityLabel?: string;
  volatilityDetail?: string;
}

export function WatchlistRow({ name, price, store, volatilityLabel, volatilityDetail }: Props) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-black text-slate-950">{name}</span>
        <span className="font-black text-emerald-800">{price}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-600">{store}</p>
      {volatilityLabel ? (
        <p className="mt-2 text-sm font-bold text-amber-900">
          {volatilityLabel}{volatilityDetail ? ` · ${volatilityDetail}` : ''}
        </p>
      ) : null}
    </div>
  );
}
