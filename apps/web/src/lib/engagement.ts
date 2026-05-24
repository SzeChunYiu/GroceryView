export type EngagementMetric = {
  path: string;
  startedAt: number;
  endedAt: number;
  timeOnPageMs: number;
  maxScrollDepthPercent: number;
  bounced: boolean;
  interactionCount: number;
  adminUxPath: '/admin/ux';
};

export type EngagementTracker = {
  markInteraction(): void;
  markScroll(scrollDepthPercent?: number): void;
  snapshot(now?: number): EngagementMetric;
  stop(now?: number): EngagementMetric;
};

export type EngagementTrackerOptions = {
  path?: string;
  now?: () => number;
  viewportHeight?: () => number;
  scrollHeight?: () => number;
  scrollY?: () => number;
};

const DEFAULT_BOUNCE_INTERACTIONS = 0;
const DEFAULT_BOUNCE_SCROLL_DEPTH = 10;

export function createEngagementTracker(options: EngagementTrackerOptions = {}): EngagementTracker {
  const now = options.now ?? (() => Date.now());
  const startedAt = now();
  const path = options.path ?? currentPath();
  let interactionCount = 0;
  let maxScrollDepthPercent = currentScrollDepth(options);

  return {
    markInteraction() {
      interactionCount += 1;
    },
    markScroll(scrollDepthPercent = currentScrollDepth(options)) {
      maxScrollDepthPercent = Math.max(maxScrollDepthPercent, clampPercent(scrollDepthPercent));
    },
    snapshot(snapshotNow = now()) {
      return buildMetric({ path, startedAt, endedAt: snapshotNow, interactionCount, maxScrollDepthPercent });
    },
    stop(stoppedAt = now()) {
      return buildMetric({ path, startedAt, endedAt: stoppedAt, interactionCount, maxScrollDepthPercent });
    }
  };
}

export function aggregateEngagementForAdminUx(metrics: EngagementMetric[]) {
  const pageCount = metrics.length;
  const totalTimeOnPageMs = metrics.reduce((sum, metric) => sum + metric.timeOnPageMs, 0);
  const bounceCount = metrics.filter((metric) => metric.bounced).length;
  const maxScrollDepthPercent = metrics.reduce((max, metric) => Math.max(max, metric.maxScrollDepthPercent), 0);

  return {
    adminUxPath: '/admin/ux' as const,
    pageCount,
    averageTimeOnPageMs: pageCount === 0 ? 0 : Math.round(totalTimeOnPageMs / pageCount),
    bounceRate: pageCount === 0 ? 0 : bounceCount / pageCount,
    maxScrollDepthPercent
  };
}

export function installEngagementCapture(
  sendMetric: (metric: EngagementMetric) => void,
  options: EngagementTrackerOptions = {}
): () => EngagementMetric {
  const tracker = createEngagementTracker(options);
  const onScroll = () => tracker.markScroll();
  const onInteraction = () => tracker.markInteraction();
  const onPageHide = () => sendMetric(tracker.stop());

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onInteraction, { passive: true });
    window.addEventListener('keydown', onInteraction);
    window.addEventListener('pagehide', onPageHide, { once: true });
  }

  return () => {
    const metric = tracker.stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('pagehide', onPageHide);
    }
    sendMetric(metric);
    return metric;
  };
}

function buildMetric(input: {
  path: string;
  startedAt: number;
  endedAt: number;
  interactionCount: number;
  maxScrollDepthPercent: number;
}): EngagementMetric {
  const timeOnPageMs = Math.max(0, input.endedAt - input.startedAt);
  return {
    path: input.path,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    timeOnPageMs,
    maxScrollDepthPercent: clampPercent(input.maxScrollDepthPercent),
    bounced: input.interactionCount <= DEFAULT_BOUNCE_INTERACTIONS && input.maxScrollDepthPercent < DEFAULT_BOUNCE_SCROLL_DEPTH,
    interactionCount: input.interactionCount,
    adminUxPath: '/admin/ux'
  };
}

function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

function currentScrollDepth(options: EngagementTrackerOptions): number {
  if (typeof window === 'undefined' && !options.scrollY) return 0;
  const scrollY = options.scrollY?.() ?? window.scrollY;
  const viewportHeight = options.viewportHeight?.() ?? window.innerHeight;
  const scrollHeight = options.scrollHeight?.() ?? document.documentElement.scrollHeight;
  if (scrollHeight <= viewportHeight) return 100;
  return clampPercent(((scrollY + viewportHeight) / scrollHeight) * 100);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
