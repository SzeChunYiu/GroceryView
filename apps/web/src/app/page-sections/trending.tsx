export type TrendingPriceDrop = {
  id: string;
  name: string;
  store: string;
  currentPrice: number;
  previousPrice: number;
  deltaPercent: number;
  confidence: number;
  urgency: "low-stock" | "ending-soon" | "watch";
  urgencyLabel: string;
};

export const trendingPriceDropsFixture: TrendingPriceDrop[] = [
  {
    id: "oat-milk-ica",
    name: "Oat milk 1L",
    store: "ICA",
    currentPrice: 18.9,
    previousPrice: 22.9,
    deltaPercent: -17,
    confidence: 0.92,
    urgency: "ending-soon",
    urgencyLabel: "Ends tonight",
  },
  {
    id: "coffee-coop",
    name: "Filter coffee 450g",
    store: "Coop",
    currentPrice: 49.9,
    previousPrice: 59.9,
    deltaPercent: -17,
    confidence: 0.87,
    urgency: "low-stock",
    urgencyLabel: "Low stock nearby",
  },
];

const currency = new Intl.NumberFormat("sv-SE", {
  currency: "SEK",
  maximumFractionDigits: 2,
  style: "currency",
});

export function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}% confidence`;
}

export function formatDelta(deltaPercent: number) {
  return `${deltaPercent}%`;
}

export function renderTrendingCardText(item: TrendingPriceDrop) {
  return [
    item.name,
    item.store,
    currency.format(item.currentPrice),
    `${formatDelta(item.deltaPercent)} price drop`,
    formatConfidence(item.confidence),
    item.urgencyLabel,
  ].join(" ");
}

export function TrendingPriceDrops({
  items = trendingPriceDropsFixture,
}: {
  items?: TrendingPriceDrop[];
}) {
  return (
    <section aria-labelledby="trending-price-drops-title">
      <h2 id="trending-price-drops-title">Trending price drops</h2>
      <div>
        {items.map((item) => (
          <article data-urgency={item.urgency} key={item.id}>
            <p>{item.store}</p>
            <h3>{item.name}</h3>
            <p>{currency.format(item.currentPrice)}</p>
            <p>{formatDelta(item.deltaPercent)} price drop</p>
            <p>{formatConfidence(item.confidence)}</p>
            <p>{item.urgencyLabel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrendingPriceDrops;
