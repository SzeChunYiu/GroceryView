export type EngagementMetric = {
  path: string;
  timeOnPageMs: number;
  scrollDepthPct: number;
  bounced: boolean;
  capturedAt: string;
};

export type EngagementTracker = {
  recordInteraction(): void;
  snapshot(): EngagementMetric;
  stop(): EngagementMetric;
};

const BOUNCE_INTERACTION_THRESHOLD = 2;

export function createEngagementTracker(path: string, now: () => number = () => Date.now()): EngagementTracker {
  const startedAt = now();
  let maxScrollDepthPct = 0;
  let interactions = 0;

  const updateScrollDepth = () => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    maxScrollDepthPct = Math.max(maxScrollDepthPct, Math.min(100, Math.round((scrollTop / scrollable) * 100)));
  };

  const snapshot = (): EngagementMetric => {
    updateScrollDepth();
    return {
      path,
      timeOnPageMs: Math.max(0, now() - startedAt),
      scrollDepthPct: maxScrollDepthPct,
      bounced: interactions < BOUNCE_INTERACTION_THRESHOLD && maxScrollDepthPct < 25,
      capturedAt: new Date(now()).toISOString()
    };
  };

  return {
    recordInteraction() {
      interactions += 1;
      updateScrollDepth();
    },
    snapshot,
    stop: snapshot
  };
}

export function aggregateEngagementForAdmin(metrics: EngagementMetric[]) {
  const visits = metrics.length;
  const totalTimeOnPageMs = metrics.reduce((sum, metric) => sum + metric.timeOnPageMs, 0);
  const totalScrollDepthPct = metrics.reduce((sum, metric) => sum + metric.scrollDepthPct, 0);
  const bounces = metrics.filter((metric) => metric.bounced).length;

  return {
    visits,
    averageTimeOnPageMs: visits === 0 ? 0 : Math.round(totalTimeOnPageMs / visits),
    averageScrollDepthPct: visits === 0 ? 0 : Math.round(totalScrollDepthPct / visits),
    bounceRatePct: visits === 0 ? 0 : Math.round((bounces / visits) * 100)
  };
}
