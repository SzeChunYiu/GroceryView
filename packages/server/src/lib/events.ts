export type AnonymousEventName = 'page_view' | 'cta_click' | 'search' | 'conversion';

export type AnonymousClientEvent = {
  name: AnonymousEventName;
  path: string;
  timestamp: string;
  count?: number;
  meta?: Record<string, string | number | boolean>;
};

export type AggregatedEvent = {
  name: AnonymousEventName;
  path: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

function cleanPath(path: string): string {
  const parsed = new URL(path, 'https://groceryview.local');
  return parsed.pathname;
}

function cleanMeta(meta: AnonymousClientEvent['meta']): AnonymousClientEvent['meta'] {
  if (!meta) return undefined;
  return Object.fromEntries(Object.entries(meta).filter(([key, value]) => !/email|user|name|phone|token|session/i.test(key) && ['string', 'number', 'boolean'].includes(typeof value))) as Record<string, string | number | boolean>;
}

export function normalizeAnonymousClientEvent(event: AnonymousClientEvent): AnonymousClientEvent {
  const timestamp = new Date(event.timestamp);
  if (Number.isNaN(timestamp.getTime())) throw new Error('timestamp must be valid.');
  return {
    name: event.name,
    path: cleanPath(event.path),
    timestamp: timestamp.toISOString(),
    count: Math.max(1, Math.floor(event.count ?? 1)),
    ...(cleanMeta(event.meta) ? { meta: cleanMeta(event.meta) } : {})
  };
}

export function aggregateAnonymousEvents(events: readonly AnonymousClientEvent[]): AggregatedEvent[] {
  const buckets = new Map<string, AggregatedEvent>();
  for (const input of events) {
    const event = normalizeAnonymousClientEvent(input);
    const key = `${event.name}:${event.path}`;
    const current = buckets.get(key);
    if (!current) {
      buckets.set(key, { name: event.name, path: event.path, count: event.count ?? 1, firstSeenAt: event.timestamp, lastSeenAt: event.timestamp });
      continue;
    }
    current.count += event.count ?? 1;
    if (event.timestamp < current.firstSeenAt) current.firstSeenAt = event.timestamp;
    if (event.timestamp > current.lastSeenAt) current.lastSeenAt = event.timestamp;
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
}
