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
}

export function WatchlistRow({ name, price, store }: Props) {
  return (
    <div>
      <span>{name}</span>
      <span>{price}</span>
      <span>{store}</span>
    </div>
  );
}
