'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const engagementStorageKey = 'groceryview:ux-engagement:v1';
const maxStoredEngagementEvents = 120;

export type EngagementMetric = {
  path: string;
  startedAt: string;
  endedAt: string;
  timeOnPageMs: number;
  scrollDepthPercent: number;
  bounced: boolean;
};

export type EngagementRouteSummary = {
  path: string;
  visits: number;
  bounces: number;
  bounceRate: number;
  averageTimeOnPageMs: number;
  averageScrollDepthPercent: number;
};

export type EngagementDashboard = {
  events: EngagementMetric[];
  routes: EngagementRouteSummary[];
  totals: {
    visits: number;
    bounces: number;
    bounceRate: number;
    averageTimeOnPageMs: number;
    averageScrollDepthPercent: number;
  };
};

function safeReadEvents(): EngagementMetric[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(engagementStorageKey) || '[]') as EngagementMetric[];
    return Array.isArray(parsed)
      ? parsed.filter((event) => typeof event.path === 'string' && typeof event.timeOnPageMs === 'number')
      : [];
  } catch {
    return [];
  }
}

function writeEvents(events: EngagementMetric[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(engagementStorageKey, JSON.stringify(events.slice(-maxStoredEngagementEvents)));
}

export function recordEngagementMetric(metric: EngagementMetric) {
  writeEvents([...safeReadEvents(), metric]);
  window.dispatchEvent(new CustomEvent('groceryview:ux-engagement-updated', { detail: metric }));
}

function summarizeRoute(path: string, events: EngagementMetric[]): EngagementRouteSummary {
  const visits = events.length;
  const bounces = events.filter((event) => event.bounced).length;
  return {
    path,
    visits,
    bounces,
    bounceRate: visits > 0 ? bounces / visits : 0,
    averageTimeOnPageMs: visits > 0 ? events.reduce((total, event) => total + event.timeOnPageMs, 0) / visits : 0,
    averageScrollDepthPercent: visits > 0 ? events.reduce((total, event) => total + event.scrollDepthPercent, 0) / visits : 0
  };
}

export function readEngagementDashboard(): EngagementDashboard {
  const events = safeReadEvents();
  const routeGroups = new Map<string, EngagementMetric[]>();
  for (const event of events) {
    routeGroups.set(event.path, [...(routeGroups.get(event.path) ?? []), event]);
  }

  const routes = [...routeGroups.entries()]
    .map(([path, routeEvents]) => summarizeRoute(path, routeEvents))
    .sort((left, right) => right.visits - left.visits || left.path.localeCompare(right.path));

  return {
    events,
    routes,
    totals: summarizeRoute('All routes', events)
  };
}

export function clearEngagementDashboard() {
  if (typeof window === 'undefined') return readEngagementDashboard();
  window.localStorage.removeItem(engagementStorageKey);
  window.dispatchEvent(new Event('groceryview:ux-engagement-updated'));
  return readEngagementDashboard();
}

function currentScrollDepthPercent() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    viewportHeight
  );
  return Math.min(100, Math.round(((scrollTop + viewportHeight) / pageHeight) * 100));
}

export function EngagementReporter() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const startedAt = Date.now();
    let maxScrollDepthPercent = currentScrollDepthPercent();
    let interacted = false;
    let finalized = false;

    function markInteraction() {
      interacted = true;
    }

    function updateScrollDepth() {
      maxScrollDepthPercent = Math.max(maxScrollDepthPercent, currentScrollDepthPercent());
    }

    function finalize() {
      if (finalized) return;
      finalized = true;
      updateScrollDepth();
      const endedAt = Date.now();
      const timeOnPageMs = Math.max(0, endedAt - startedAt);
      recordEngagementMetric({
        path: pathname || '/',
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        timeOnPageMs,
        scrollDepthPercent: maxScrollDepthPercent,
        bounced: !interacted && maxScrollDepthPercent < 35 && timeOnPageMs < 15000
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') finalize();
    }

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    window.addEventListener('pointerdown', markInteraction, { passive: true });
    window.addEventListener('keydown', markInteraction);
    window.addEventListener('pagehide', finalize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      finalize();
      window.removeEventListener('scroll', updateScrollDepth);
      window.removeEventListener('pointerdown', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('pagehide', finalize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
