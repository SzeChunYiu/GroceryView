export type PriceHistoryPoint = {
  date?: string;
  observedAt?: string;
  price: number;
  priceLabel?: string;
};

export function last30DaysPriceHistory<T extends PriceHistoryPoint>(points: readonly T[], now = new Date()): T[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);

  const datedPoints = points.filter((point) => {
    const timestamp = point.observedAt ?? point.date;
    if (!timestamp) return false;
    const observedAt = new Date(timestamp);
    return Number.isFinite(observedAt.getTime()) && observedAt >= cutoff && observedAt <= now;
  });

  return (datedPoints.length > 0 ? datedPoints : points.slice(-30)).slice(-30);
}

export function priceHistoryTrendLabel(points: readonly PriceHistoryPoint[]) {
  if (points.length < 2) return 'Needs at least two observed price-history points.';

  const first = points[0]?.price ?? 0;
  const latest = points.at(-1)?.price ?? first;
  const delta = latest - first;
  if (delta === 0) return 'Flat over the last 30 days.';

  return `${delta > 0 ? 'Up' : 'Down'} ${Math.abs(delta).toFixed(2)} SEK over the last 30 days.`;
}
