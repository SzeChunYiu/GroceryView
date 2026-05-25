export type AnonymousClientEventName = 'page_view' | 'cta_click' | 'search' | 'conversion';

export type AnonymousClientEvent = {
  name: AnonymousClientEventName;
  path?: string;
  target?: string;
  query?: string;
  conversion?: string;
  consentVersion: string;
  occurredAt: string;
};

export type AnonymousClientEventBucket = {
  name: AnonymousClientEventName;
  key: string;
  count: number;
  lastOccurredAt: string;
};

const anonymousEventBuckets = new Map<string, AnonymousClientEventBucket>();

function cleanDimension(value: string | undefined, fallback: string) {
  const cleaned = (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9åäö/_ -]+/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 96);
  return cleaned || fallback;
}

function eventBucketKey(event: AnonymousClientEvent) {
  if (event.name === 'page_view') return cleanDimension(event.path, '/');
  if (event.name === 'cta_click') return cleanDimension(event.target, 'unknown_cta');
  if (event.name === 'search') return cleanDimension(event.query, 'unknown_search');
  return cleanDimension(event.conversion, 'unknown_conversion');
}

export function recordAnonymousClientEvent(event: AnonymousClientEvent): AnonymousClientEventBucket {
  const key = `${event.name}:${eventBucketKey(event)}`;
  const current = anonymousEventBuckets.get(key);
  const next: AnonymousClientEventBucket = {
    name: event.name,
    key,
    count: (current?.count ?? 0) + 1,
    lastOccurredAt: event.occurredAt
  };
  anonymousEventBuckets.set(key, next);
  return next;
}

export function snapshotAnonymousClientEvents(): AnonymousClientEventBucket[] {
  return [...anonymousEventBuckets.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export function resetAnonymousClientEvents() {
  anonymousEventBuckets.clear();
}
