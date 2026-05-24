export type PriceTrendObservation = {
  observedAt: string;
  price: number;
};

export type PriceTrendPrediction = {
  available: boolean;
  direction: 'falling' | 'flat' | 'rising';
  action: 'delay' | 'buy-now' | 'hold';
  expectedChangePercent: number;
  confidence: number;
  observationCount: number;
  latestPrice: number | null;
  recentAverage: number | null;
  previousAverage: number | null;
  windowDays: number;
  detail: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function averagePrice(points: PriceTrendObservation[]) {
  return points.reduce((sum, point) => sum + point.price, 0) / points.length;
}

function observedTimeFor(observedAt: string) {
  const parsed = Date.parse(observedAt);
  return Number.isFinite(parsed) ? parsed : Date.parse(`${observedAt}T00:00:00.000Z`);
}

export function predictShortWindowPriceDirection(observations: PriceTrendObservation[], windowDays = 14): PriceTrendPrediction {
  const ordered = observations
    .map((observation) => ({
      ...observation,
      observedTime: observedTimeFor(observation.observedAt)
    }))
    .filter((observation) => Number.isFinite(observation.observedTime) && Number.isFinite(observation.price))
    .sort((a, b) => a.observedTime - b.observedTime);

  const latest = ordered.at(-1);
  if (!latest || ordered.length < 4) {
    return {
      available: false,
      direction: 'flat',
      action: 'hold',
      expectedChangePercent: 0,
      confidence: 0,
      observationCount: ordered.length,
      latestPrice: latest?.price ?? null,
      recentAverage: null,
      previousAverage: null,
      windowDays,
      detail: 'Not enough dated observations exist to compute a short-window price direction.'
    };
  }

  const recentStart = latest.observedTime - windowDays * DAY_MS;
  const previousStart = latest.observedTime - windowDays * 2 * DAY_MS;
  let recentPoints = ordered.filter((point) => point.observedTime > recentStart && point.observedTime <= latest.observedTime);
  let previousPoints = ordered.filter((point) => point.observedTime > previousStart && point.observedTime <= recentStart);

  if (recentPoints.length === 0 || previousPoints.length === 0) {
    const fallback = ordered.slice(-Math.min(ordered.length, 8));
    const splitAt = Math.max(2, Math.floor(fallback.length / 2));
    previousPoints = fallback.slice(0, splitAt);
    recentPoints = fallback.slice(splitAt);
  }

  if (recentPoints.length === 0 || previousPoints.length === 0) {
    return {
      available: false,
      direction: 'flat',
      action: 'hold',
      expectedChangePercent: 0,
      confidence: 0,
      observationCount: ordered.length,
      latestPrice: latest.price,
      recentAverage: null,
      previousAverage: null,
      windowDays,
      detail: 'The dated observations cannot be split into recent and previous comparison windows.'
    };
  }

  const recentAverage = averagePrice(recentPoints);
  const previousAverage = averagePrice(previousPoints);
  const expectedChangePercent = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;
  const direction = expectedChangePercent <= -1 ? 'falling' : expectedChangePercent >= 1 ? 'rising' : 'flat';
  const confidence = Math.min(1, ordered.length / 12) * Math.min(1, (recentPoints.length + previousPoints.length) / 6);

  return {
    available: true,
    direction,
    action: direction === 'falling' ? 'delay' : direction === 'rising' ? 'buy-now' : 'hold',
    expectedChangePercent,
    confidence,
    observationCount: ordered.length,
    latestPrice: latest.price,
    recentAverage,
    previousAverage,
    windowDays,
    detail: `Compares the latest ${recentPoints.length} dated point(s) with ${previousPoints.length} prior point(s) inside a ${windowDays}-day short-window trend.`
  };
}
