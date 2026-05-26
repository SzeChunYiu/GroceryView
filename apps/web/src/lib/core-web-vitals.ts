export type CoreWebVitalMetric = 'CLS' | 'INP' | 'LCP';
export type CoreWebVitalDeviceSegment = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export type CoreWebVitalConnectionSegment = '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
export type CoreWebVitalRating = 'good' | 'needs_improvement' | 'poor';

export type CoreWebVitalEvent = {
  metric: CoreWebVitalMetric;
  value: number;
  route: string;
  market: string;
  device: CoreWebVitalDeviceSegment;
  connection: CoreWebVitalConnectionSegment;
  observedAt: string;
  source: 'web-client-performance-observer';
};

export type CoreWebVitalSegmentRollup = Pick<CoreWebVitalEvent, 'connection' | 'device' | 'market' | 'metric' | 'route'> & {
  p75: number;
  rating: CoreWebVitalRating;
  sampleSize: number;
};

export type CoreWebVitalAlert = CoreWebVitalSegmentRollup & {
  severity: 'regression' | 'watch';
  threshold: number;
};

export type CoreWebVitalsDashboard = {
  available: boolean;
  generatedAt: string;
  observationCount: number;
  segments: CoreWebVitalSegmentRollup[];
  alerts: CoreWebVitalAlert[];
  thresholds: Record<CoreWebVitalMetric, { good: number; poor: number; unit: 'ms' | 'score' }>;
  guardrail: string;
};

type IncomingCoreWebVitalEvent = {
  metric?: unknown;
  value?: unknown;
  route?: unknown;
  market?: unknown;
  device?: unknown;
  connection?: unknown;
};

const acceptedMetrics = new Set<CoreWebVitalMetric>(['CLS', 'INP', 'LCP']);
const acceptedDevices = new Set<CoreWebVitalDeviceSegment>(['desktop', 'mobile', 'tablet', 'unknown']);
const acceptedConnections = new Set<CoreWebVitalConnectionSegment>(['2g', '3g', '4g', 'slow-2g', 'unknown']);
const maxSamples = 1000;

export const coreWebVitalThresholds: CoreWebVitalsDashboard['thresholds'] = {
  CLS: { good: 0.1, poor: 0.25, unit: 'score' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  LCP: { good: 2500, poor: 4000, unit: 'ms' }
};

const recentCoreWebVitalEvents: CoreWebVitalEvent[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeMetric(value: unknown): CoreWebVitalMetric | null {
  return typeof value === 'string' && acceptedMetrics.has(value as CoreWebVitalMetric)
    ? value as CoreWebVitalMetric
    : null;
}

function normalizeValue(metric: CoreWebVitalMetric, value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (metric === 'CLS') return value >= 0 && value <= 10 ? value : null;
  return value > 0 && value <= 60000 ? value : null;
}

function normalizeRoute(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let path = trimmed;
  try {
    path = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed).pathname
      : trimmed.split(/[?#]/, 1)[0];
  } catch {
    return null;
  }

  if (!path.startsWith('/')) path = `/${path}`;
  path = path
    .split('/')
    .map((segment) => {
      if (/^\d{3,}$/.test(segment)) return ':id';
      if (/^[0-9a-f]{8,}$/i.test(segment)) return ':id';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment)) return ':id';
      if (segment.length > 64) return ':slug';
      return segment;
    })
    .join('/');

  return path.length <= 160 ? path : null;
}

function normalizeMarket(value: unknown) {
  if (typeof value !== 'string') return null;
  const market = value.trim().toLocaleLowerCase('en-US');
  if (market === 'unknown') return market;
  return /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/.test(market) ? market : null;
}

function normalizeIncomingEvent(value: unknown, observedAt: string): CoreWebVitalEvent | null {
  if (!isRecord(value)) return null;
  const event = value as IncomingCoreWebVitalEvent;
  const metric = normalizeMetric(event.metric);
  if (!metric) return null;

  const normalizedValue = normalizeValue(metric, event.value);
  const route = normalizeRoute(event.route);
  const market = normalizeMarket(event.market);
  const device = typeof event.device === 'string' && acceptedDevices.has(event.device as CoreWebVitalDeviceSegment)
    ? event.device as CoreWebVitalDeviceSegment
    : null;
  const connection = typeof event.connection === 'string' && acceptedConnections.has(event.connection as CoreWebVitalConnectionSegment)
    ? event.connection as CoreWebVitalConnectionSegment
    : null;

  if (normalizedValue === null || !route || !market || !device || !connection) return null;

  return {
    connection,
    device,
    market,
    metric,
    observedAt,
    route,
    source: 'web-client-performance-observer',
    value: normalizedValue
  };
}

function segmentKey(event: Pick<CoreWebVitalEvent, 'connection' | 'device' | 'market' | 'metric' | 'route'>) {
  return `${event.metric}::${event.route}::${event.market}::${event.device}::${event.connection}`;
}

function percentile75(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * 0.75) - 1);
  return sorted[index];
}

function roundedMetricValue(metric: CoreWebVitalMetric, value: number) {
  return metric === 'CLS' ? Number(value.toFixed(3)) : Math.round(value);
}

export function coreWebVitalRating(metric: CoreWebVitalMetric, value: number): CoreWebVitalRating {
  const threshold = coreWebVitalThresholds[metric];
  if (value <= threshold.good) return 'good';
  return value > threshold.poor ? 'poor' : 'needs_improvement';
}

export function recordCoreWebVitalEvents(values: unknown[]) {
  const observedAt = new Date().toISOString();
  const normalized = values
    .map((value) => normalizeIncomingEvent(value, observedAt))
    .filter((event): event is CoreWebVitalEvent => event !== null);

  recentCoreWebVitalEvents.push(...normalized);
  while (recentCoreWebVitalEvents.length > maxSamples) {
    recentCoreWebVitalEvents.shift();
  }

  return {
    accepted: normalized.length,
    rejected: values.length - normalized.length
  };
}

export function getCoreWebVitalsDashboard(generatedAt = new Date().toISOString()): CoreWebVitalsDashboard {
  const buckets = new Map<string, CoreWebVitalEvent[]>();
  for (const event of recentCoreWebVitalEvents) {
    const key = segmentKey(event);
    buckets.set(key, [...(buckets.get(key) ?? []), event]);
  }

  const segments = [...buckets.values()]
    .map((events) => {
      const event = events[0];
      const p75 = roundedMetricValue(event.metric, percentile75(events.map((item) => item.value)));
      return {
        connection: event.connection,
        device: event.device,
        market: event.market,
        metric: event.metric,
        p75,
        rating: coreWebVitalRating(event.metric, p75),
        route: event.route,
        sampleSize: events.length
      };
    })
    .sort((left, right) => {
      const ratingOrder = { poor: 0, needs_improvement: 1, good: 2 };
      return ratingOrder[left.rating] - ratingOrder[right.rating]
        || right.sampleSize - left.sampleSize
        || left.route.localeCompare(right.route)
        || left.metric.localeCompare(right.metric);
    });

  return {
    alerts: segments
      .filter((segment) => segment.rating !== 'good')
      .map((segment) => ({
        ...segment,
        severity: segment.rating === 'poor' ? 'regression' : 'watch',
        threshold: coreWebVitalThresholds[segment.metric][segment.rating === 'poor' ? 'poor' : 'good']
      })),
    available: recentCoreWebVitalEvents.length > 0,
    generatedAt,
    guardrail: 'Core Web Vitals telemetry stores metric values with coarse route, market, device, and connection segments only; it strips query strings and does not store user ids, session ids, search terms, or raw URLs.',
    observationCount: recentCoreWebVitalEvents.length,
    segments,
    thresholds: coreWebVitalThresholds
  };
}

export function resetCoreWebVitalsDashboardForTests() {
  recentCoreWebVitalEvents.length = 0;
}
