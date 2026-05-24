export type PricePredictionObservation = {
  observedAt: string;
  price: number;
};

export type PricePredictionDirection = 'down' | 'flat' | 'up' | 'unknown';

export type PricePredictionSnapshot = {
  observedAt: string;
  price: number;
  marker: 'latest' | 'lower' | 'higher' | 'same';
};

export type PriceDirectionPrediction = {
  actionLabel: string;
  available: boolean;
  confidence: number;
  confidenceLabel: string;
  detail: string;
  direction: PricePredictionDirection;
  directionLabel: string;
  expectedChangePercent: number | null;
  expectedPrice: number | null;
  latestPrice: number | null;
  observationCount: number;
  snapshots: PricePredictionSnapshot[];
  title: string;
  windowLabel: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SHORT_WINDOW_DAYS = 45;
const LOOKAHEAD_DAYS = 14;
const MIN_POINTS = 3;
const FLAT_THRESHOLD_PERCENT = 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function observedTime(point: PricePredictionObservation) {
  return Date.parse(`${point.observedAt.slice(0, 10)}T00:00:00.000Z`);
}

function confidenceLabelFor(confidence: number) {
  if (confidence >= 0.75) return 'high short-window confidence';
  if (confidence >= 0.45) return 'medium short-window confidence';
  return 'low short-window confidence';
}

function snapshotsFor(points: PricePredictionObservation[]): PricePredictionSnapshot[] {
  return points.slice(-5).map((point, index, recentPoints) => {
    const previous = index > 0 ? recentPoints[index - 1] : null;
    const marker = index === recentPoints.length - 1
      ? 'latest'
      : previous === null || Math.abs(point.price - previous.price) < 0.01
        ? 'same'
        : point.price < previous.price
          ? 'lower'
          : 'higher';

    return {
      observedAt: point.observedAt,
      price: point.price,
      marker
    };
  });
}

function unavailablePrediction(points: PricePredictionObservation[], detail: string): PriceDirectionPrediction {
  const latest = points.at(-1) ?? null;
  return {
    actionLabel: 'Use current verified price',
    available: false,
    confidence: 0,
    confidenceLabel: 'prediction withheld',
    detail,
    direction: 'unknown',
    directionLabel: 'prediction withheld',
    expectedChangePercent: null,
    expectedPrice: null,
    latestPrice: latest?.price ?? null,
    observationCount: points.length,
    snapshots: snapshotsFor(points),
    title: 'Short-window price prediction',
    windowLabel: `${SHORT_WINDOW_DAYS}-day window`
  };
}

export function predictShortWindowPriceDirection(observations: ReadonlyArray<PricePredictionObservation>): PriceDirectionPrediction {
  const orderedPoints = observations
    .filter((point) => Number.isFinite(point.price) && Number.isFinite(observedTime(point)))
    .sort((left, right) => observedTime(left) - observedTime(right));

  if (orderedPoints.length < MIN_POINTS) {
    return unavailablePrediction(
      orderedPoints,
      'At least three dated price snapshots are required before GroceryView computes a short-window expected direction.'
    );
  }

  const latest = orderedPoints.at(-1)!;
  const latestTime = observedTime(latest);
  const windowStartTime = latestTime - SHORT_WINDOW_DAYS * DAY_MS;
  const windowPoints = orderedPoints.filter((point) => observedTime(point) >= windowStartTime && observedTime(point) <= latestTime);

  if (windowPoints.length < MIN_POINTS) {
    return unavailablePrediction(
      windowPoints,
      `Only ${windowPoints.length} dated snapshot(s) fall inside the recent ${SHORT_WINDOW_DAYS}-day window, so the prediction is withheld.`
    );
  }

  const stepDeltas = windowPoints.slice(1).map((point, index) => point.price - windowPoints[index]!.price);
  const timeDeltas = windowPoints.slice(1).map((point, index) => Math.max((observedTime(point) - observedTime(windowPoints[index]!)) / DAY_MS, 1));
  const averageStepDelta = stepDeltas.reduce((sum, delta) => sum + delta, 0) / stepDeltas.length;
  const averageGapDays = timeDeltas.reduce((sum, days) => sum + days, 0) / timeDeltas.length;
  const expectedDelta = averageStepDelta * (LOOKAHEAD_DAYS / averageGapDays);
  const expectedPrice = Math.max(0, latest.price + expectedDelta);
  const expectedChangePercent = latest.price > 0 ? (expectedDelta / latest.price) * 100 : 0;
  const direction: PricePredictionDirection = Math.abs(expectedChangePercent) < FLAT_THRESHOLD_PERCENT
    ? 'flat'
    : expectedChangePercent < 0
      ? 'down'
      : 'up';
  const confidence = clamp(windowPoints.length / 8, 0.25, 1);
  const directionLabel = direction === 'down'
    ? 'expected to ease'
    : direction === 'up'
      ? 'expected to rise'
      : 'expected to hold steady';
  const actionLabel = direction === 'down'
    ? 'Delay if flexible'
    : direction === 'up'
      ? 'Buy sooner'
      : 'No timing edge';

  return {
    actionLabel,
    available: true,
    confidence,
    confidenceLabel: confidenceLabelFor(confidence),
    detail: `Expected direction uses the average move between ${windowPoints.length} recent dated price snapshots and projects only the next ${LOOKAHEAD_DAYS} days. It is a lightweight trend snapshot, not a promotion guarantee.`,
    direction,
    directionLabel,
    expectedChangePercent,
    expectedPrice,
    latestPrice: latest.price,
    observationCount: windowPoints.length,
    snapshots: snapshotsFor(windowPoints),
    title: 'Short-window price prediction',
    windowLabel: `${SHORT_WINDOW_DAYS}-day window`
  };
}
