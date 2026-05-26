'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { CoreWebVitalConnectionSegment, CoreWebVitalDeviceSegment, CoreWebVitalMetric } from '@/lib/core-web-vitals';

type ConsentCategories = Record<'necessary' | 'analytics' | 'ads' | 'personalisation', boolean>;
type ConsentSnapshot = {
  policyVersion?: string;
  categories?: Partial<ConsentCategories>;
};

type LargestContentfulPaintEntry = PerformanceEntry & {
  loadTime?: number;
  renderTime?: number;
};

type LayoutShiftEntry = PerformanceEntry & {
  hadRecentInput?: boolean;
  value?: number;
};

type PerformanceEventTimingEntry = PerformanceEntry & {
  duration?: number;
  interactionId?: number;
};

const consentPolicyVersion = '2026-05-22-consent-v1';
const consentStorageKey = 'groceryview:consent:state';
const endpoint = '/api/analytics/core-web-vitals';

function analyticsConsentGranted() {
  if (typeof window === 'undefined') return false;

  const runtimeConsent = (window as Window & { groceryviewConsent?: ConsentSnapshot }).groceryviewConsent;
  if (runtimeConsent?.policyVersion === consentPolicyVersion) {
    return runtimeConsent.categories?.analytics === true;
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(consentStorageKey) || 'null') as ConsentSnapshot | null;
    return stored?.policyVersion === consentPolicyVersion && stored.categories?.analytics === true;
  } catch {
    return false;
  }
}

function supportedEntryType(type: string) {
  return typeof PerformanceObserver !== 'undefined'
    && Array.isArray(PerformanceObserver.supportedEntryTypes)
    && PerformanceObserver.supportedEntryTypes.includes(type);
}

function marketFromRoute(route: string) {
  const firstSegment = route.split('/').filter(Boolean)[0];
  return firstSegment && /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/i.test(firstSegment)
    ? firstSegment.toLocaleLowerCase('en-US')
    : 'se';
}

function deviceSegment(): CoreWebVitalDeviceSegment {
  if (typeof window === 'undefined') return 'unknown';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

function connectionSegment(): CoreWebVitalConnectionSegment {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;
  return connection === 'slow-2g' || connection === '2g' || connection === '3g' || connection === '4g'
    ? connection
    : 'unknown';
}

function sendEvents(events: Array<{ metric: CoreWebVitalMetric; value: number; route: string }>) {
  if (events.length === 0 || !analyticsConsentGranted()) return;

  const observedAt = new Date().toISOString();
  const payload = JSON.stringify({
    events: events.map((event) => ({
      ...event,
      connection: connectionSegment(),
      device: deviceSegment(),
      market: marketFromRoute(event.route),
      observedAt
    }))
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
    if (sent) return;
  }

  void fetch(endpoint, {
    body: payload,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined);
}

function observeRouteVitals(route: string) {
  const observers: PerformanceObserver[] = [];
  const sent = new Set<CoreWebVitalMetric>();
  let clsValue = 0;
  let clsSupported = false;
  let inpValue: number | null = null;
  let lcpValue: number | null = null;

  function observe(type: string, callback: PerformanceObserverCallback, options?: PerformanceObserverInit) {
    if (!supportedEntryType(type)) return;
    try {
      const observer = new PerformanceObserver(callback);
      observer.observe(options ?? { buffered: true, type });
      observers.push(observer);
    } catch {
      // Browsers may expose an entry type but still reject buffered observation.
    }
  }

  observe('largest-contentful-paint', (list) => {
    for (const entry of list.getEntries() as LargestContentfulPaintEntry[]) {
      lcpValue = entry.renderTime || entry.loadTime || entry.startTime;
    }
  });

  observe('layout-shift', (list) => {
    clsSupported = true;
    for (const entry of list.getEntries() as LayoutShiftEntry[]) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value ?? 0;
      }
    }
  });

  observe('event', (list) => {
    for (const entry of list.getEntries() as PerformanceEventTimingEntry[]) {
      if (!entry.interactionId || typeof entry.duration !== 'number') continue;
      inpValue = Math.max(inpValue ?? 0, entry.duration);
    }
  }, { buffered: true, durationThreshold: 40, type: 'event' } as PerformanceObserverInit & { durationThreshold: number });

  function flush() {
    const events: Array<{ metric: CoreWebVitalMetric; value: number; route: string }> = [];
    if (lcpValue !== null && !sent.has('LCP')) {
      sent.add('LCP');
      events.push({ metric: 'LCP', route, value: lcpValue });
    }
    if (clsSupported && !sent.has('CLS')) {
      sent.add('CLS');
      events.push({ metric: 'CLS', route, value: clsValue });
    }
    if (inpValue !== null && !sent.has('INP')) {
      sent.add('INP');
      events.push({ metric: 'INP', route, value: inpValue });
    }
    sendEvents(events);
  }

  function flushWhenHidden() {
    if (document.visibilityState === 'hidden') flush();
  }

  document.addEventListener('visibilitychange', flushWhenHidden);
  window.addEventListener('pagehide', flush);

  return () => {
    document.removeEventListener('visibilitychange', flushWhenHidden);
    window.removeEventListener('pagehide', flush);
    flush();
    observers.forEach((observer) => observer.disconnect());
  };
}

export function CoreWebVitalsReporter() {
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') return undefined;

    let cleanupVitals: (() => void) | null = null;

    function start() {
      if (cleanupVitals || !analyticsConsentGranted()) return;
      cleanupVitals = observeRouteVitals(pathname);
    }

    start();
    window.addEventListener('groceryview:consent-updated', start);

    return () => {
      window.removeEventListener('groceryview:consent-updated', start);
      cleanupVitals?.();
    };
  }, [pathname]);

  return null;
}
