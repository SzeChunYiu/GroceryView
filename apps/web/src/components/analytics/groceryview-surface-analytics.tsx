'use client';

import { useEffect } from 'react';
import { trackGroceryViewEvent, type GroceryViewAnalyticsDomain, type GroceryViewAnalyticsEventName } from '@/lib/analytics';

type GroceryViewSurfaceAnalyticsProps = Readonly<{
  surface: string;
  domain?: GroceryViewAnalyticsDomain;
}>;

function parseFilters(element: HTMLElement) {
  const filters: Record<string, string> = {};
  for (const attr of element.getAttributeNames()) {
    if (!attr.startsWith('data-gv-filter-')) continue;
    const value = element.getAttribute(attr);
    if (value) filters[attr.slice('data-gv-filter-'.length)] = value;
  }
  return Object.keys(filters).length > 0 ? filters : undefined;
}

function trackFromElement(element: HTMLElement, domain?: GroceryViewAnalyticsDomain) {
  const eventName = element.dataset.gvEvent as GroceryViewAnalyticsEventName | undefined;
  if (!eventName) return;

  const rankValue = element.dataset.gvRank;
  const metadata: Record<string, string | number | boolean> = {};
  if (element.dataset.gvResultCount) metadata.result_count = Number(element.dataset.gvResultCount);
  if (element.dataset.gvSort) metadata.sort = element.dataset.gvSort;

  trackGroceryViewEvent({
    eventName,
    domain,
    entityType: element.dataset.gvEntityType,
    entityId: element.dataset.gvEntityId,
    sourcePanel: element.dataset.gvSourcePanel ?? element.closest('[data-gv-surface]')?.getAttribute('data-gv-surface') ?? undefined,
    rank: rankValue ? Number(rankValue) : undefined,
    filters: parseFilters(element),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  });
}

export function GroceryViewSurfaceAnalytics({ surface, domain = 'grocery' }: GroceryViewSurfaceAnalyticsProps) {
  useEffect(() => {
    const root = document.querySelector(`[data-gv-surface="${surface}"]`);
    if (!root) return;

    const handleSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !root.contains(form)) return;

      const submitter = (event as SubmitEvent).submitter;
      const eventName = (submitter instanceof HTMLElement ? submitter.dataset.gvEvent : undefined)
        ?? form.dataset.gvEvent
        ?? (surface === 'search' ? 'search_submitted' : surface === 'market' ? 'market_filter_changed' : undefined);

      if (!eventName) return;

      const filters: Record<string, string> = {};
      for (const field of new FormData(form).entries()) {
        const [key, value] = field;
        if (typeof value === 'string' && value.trim()) filters[key] = value.trim();
      }

      trackGroceryViewEvent({
        eventName: eventName as GroceryViewAnalyticsEventName,
        domain,
        sourcePanel: `${surface}_form`,
        filters
      });
    };

    const handleClick = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-gv-event]');
      if (!target || !root.contains(target)) return;
      trackFromElement(target, domain);
    };

    root.addEventListener('submit', handleSubmit);
    root.addEventListener('click', handleClick);
    return () => {
      root.removeEventListener('submit', handleSubmit);
      root.removeEventListener('click', handleClick);
    };
  }, [domain, surface]);

  return null;
}
