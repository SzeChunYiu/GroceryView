export type PriceTrendObservation = {
  observedAt: string;
  price: number;
};

export type PriceTrendPrediction = {
  available: boolean;
  direction: 'up' | 'down' | 'flat' | 'unknown';
  headline: string;
  recommendation: string;
  confidenceLabel: string;
  observationCount: number;
  windowDays: number;
  expectedChangePercent: number | null;
  detail: string;
};

const dayInMs = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function predictShortWindowPriceTrend(
  observations: PriceTrendObservation[],
  { windowDays = 30 }: { windowDays?: number } = {}
): PriceTrendPrediction {
  const ordered = observations
    .map((observation) => ({
      observedAt: observation.observedAt,
      observedTime: Date.parse(`${observation.observedAt}T00:00:00.000Z`),
      price: observation.price
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && Number.isFinite(observation.price))
    .sort((a, b) => a.observedTime - b.observedTime);

  if (ordered.length < 3) {
    return {
      available: false,
      direction: 'unknown',
      headline: 'Price trend prediction withheld',
      recommendation: 'Wait for more observations before timing this purchase.',
      confidenceLabel: 'insufficient observation tape',
      observationCount: ordered.length,
      windowDays,
      expectedChangePercent: null,
      detail: 'At least three dated price observations are required before GroceryView computes a short-window expected direction.'
    };
  }

  const latest = ordered.at(-1)!;
  const windowStart = latest.observedTime - windowDays * dayInMs;
  const windowPoints = ordered.filter((observation) => observation.observedTime >= windowStart && observation.observedTime <= latest.observedTime);
  const points = windowPoints.length >= 3 ? windowPoints : ordered.slice(-3);
  const first = points[0]!;
  const elapsedDays = Math.max(1, (latest.observedTime - first.observedTime) / dayInMs);
  const dailySlope = (latest.price - first.price) / elapsedDays;
  const expectedChange = dailySlope * 7;
  const expectedChangePercent = latest.price > 0 ? (expectedChange / latest.price) * 100 : 0;
  const absPercent = Math.abs(expectedChangePercent);
  const direction = absPercent < 1 ? 'flat' : expectedChangePercent > 0 ? 'up' : 'down';
  const confidence = clamp(points.length / 8, 0, 1);

  return {
    available: true,
    direction,
    headline:
      direction === 'down'
        ? 'Expected to ease soon'
        : direction === 'up'
          ? 'Expected to rise soon'
          : 'Expected to stay steady',
    recommendation:
      direction === 'down'
        ? 'Delay if you can; the short-window tape points lower.'
        : direction === 'up'
          ? 'Consider buying sooner; the short-window tape points higher.'
          : 'No timing urgency; the short-window tape is broadly flat.',
    confidenceLabel: `${Math.round(confidence * 100)}% directional confidence`,
    observationCount: points.length,
    windowDays,
    expectedChangePercent,
    detail: `Computed from ${points.length} dated observations over ${Math.round(elapsedDays)} day(s); this is a short-window direction snapshot, not a guaranteed future price.`
  };
}
