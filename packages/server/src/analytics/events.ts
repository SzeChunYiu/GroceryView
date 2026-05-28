/**
 * Server-side analytics events (handoff 77). Privacy-safe: no raw search text, email, or prices in payloads.
 */

export const serverAnalyticsEventNames = [
  'search_submitted',
  'search_result_clicked',
  'search_zero_result',
  'product_opened',
  'product_watchlist_added',
  'watchlist_item_added',
  'deal_card_clicked',
  'market_filter_changed',
  'map_marker_selected'
] as const;

export type ServerAnalyticsEventName = (typeof serverAnalyticsEventNames)[number];

export type ServerAnalyticsDomain = 'grocery' | 'pharmacy' | 'fuel';

export type ServerAnalyticsMetadata = Record<string, string | number | boolean>;

export type ServerAnalyticsEvent = {
  eventName: ServerAnalyticsEventName;
  occurredAt: string;
  sessionId: string;
  pagePath: string;
  domain?: ServerAnalyticsDomain;
  entityType?: string;
  entityId?: string;
  sourcePanel?: string;
  metadata?: ServerAnalyticsMetadata;
};

export type ServerAnalyticsEventBucket = {
  eventName: ServerAnalyticsEventName;
  key: string;
  count: number;
  lastOccurredAt: string;
};

const blockedMetadataKey = /email|name|query|search|term|phone|address|user|password|token/i;
const serverAnalyticsBuckets = new Map<string, ServerAnalyticsEventBucket>();

export function analyticsSessionIdFromRequest(request: Request): string {
  const header = request.headers.get('x-groceryview-session-id')?.trim();
  if (header && header.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(header)) {
    return header;
  }
  return 'server-runtime';
}

export function queryLengthBucket(length: number): 'empty' | '1-3' | '4-8' | '9-16' | '17+' {
  if (length <= 0) return 'empty';
  if (length <= 3) return '1-3';
  if (length <= 8) return '4-8';
  if (length <= 16) return '9-16';
  return '17+';
}

function sanitizeMetadata(metadata: ServerAnalyticsMetadata | undefined): ServerAnalyticsMetadata | undefined {
  if (!metadata) return undefined;
  const next: ServerAnalyticsMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blockedMetadataKey.test(key)) continue;
    if (typeof value === 'string' && value.length > 128) continue;
    next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function bucketKey(event: ServerAnalyticsEvent): string {
  const parts = [
    event.eventName,
    event.domain ?? 'any',
    event.entityType ?? 'none',
    event.entityId ?? 'none',
    event.sourcePanel ?? 'none',
    event.metadata?.query_length_bucket ?? event.metadata?.result_count ?? 'none'
  ];
  return parts.join(':');
}

export function emitServerAnalyticsEvent(
  input: Omit<ServerAnalyticsEvent, 'occurredAt'> & { occurredAt?: string }
): ServerAnalyticsEventBucket {
  const event: ServerAnalyticsEvent = {
    ...input,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    metadata: sanitizeMetadata(input.metadata)
  };

  const key = bucketKey(event);
  const current = serverAnalyticsBuckets.get(key);
  const next: ServerAnalyticsEventBucket = {
    eventName: event.eventName,
    key,
    count: (current?.count ?? 0) + 1,
    lastOccurredAt: event.occurredAt
  };
  serverAnalyticsBuckets.set(key, next);
  return next;
}

export function snapshotServerAnalyticsEvents(): ServerAnalyticsEventBucket[] {
  return [...serverAnalyticsBuckets.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export function resetServerAnalyticsEventsForTests() {
  serverAnalyticsBuckets.clear();
}
