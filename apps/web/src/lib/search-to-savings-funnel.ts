import {
  buildSearchToSavingsFunnelDashboard,
  searchToSavingsFunnelSteps,
  type FunnelAccountSegment,
  type FunnelDeviceSegment,
  type SearchToSavingsFunnelEvent,
  type SearchToSavingsFunnelStepId
} from '@groceryview/analytics';

type IncomingFunnelEvent = {
  step?: unknown;
  count?: unknown;
  market?: unknown;
  device?: unknown;
  accountState?: unknown;
};

const acceptedSteps = new Set<SearchToSavingsFunnelStepId>(searchToSavingsFunnelSteps.map((step) => step.id));
const acceptedDevices = new Set<FunnelDeviceSegment>(['desktop', 'mobile', 'tablet', 'unknown']);
const acceptedAccountStates = new Set<FunnelAccountSegment>(['guest', 'account', 'unknown']);
const aggregateBuckets = new Map<string, SearchToSavingsFunnelEvent>();
const aggregateSource = 'web-client-aggregate';

function bucketKey(event: Pick<SearchToSavingsFunnelEvent, 'accountState' | 'device' | 'market' | 'step'>) {
  return `${event.step}::${event.market}::${event.device}::${event.accountState}`;
}

function normalizedMarket(value: unknown) {
  if (typeof value !== 'string') return null;
  const market = value.trim().toLocaleLowerCase('en-US');
  if (market === 'unknown') return market;
  return /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/.test(market) ? market : null;
}

function normalizedCount(value: unknown) {
  if (value === undefined) return 1;
  if (typeof value !== 'number') return null;
  return Number.isInteger(value) && value > 0 && value <= 100 ? value : null;
}

function normalizeIncomingFunnelEvent(value: unknown, observedAt: string): SearchToSavingsFunnelEvent | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const event = value as IncomingFunnelEvent;
  const step = typeof event.step === 'string' && acceptedSteps.has(event.step as SearchToSavingsFunnelStepId)
    ? event.step as SearchToSavingsFunnelStepId
    : null;
  const market = normalizedMarket(event.market);
  const device = typeof event.device === 'string' && acceptedDevices.has(event.device as FunnelDeviceSegment)
    ? event.device as FunnelDeviceSegment
    : null;
  const accountState = typeof event.accountState === 'string' && acceptedAccountStates.has(event.accountState as FunnelAccountSegment)
    ? event.accountState as FunnelAccountSegment
    : null;
  const count = normalizedCount(event.count);

  if (!step || !market || !device || !accountState || count === null) return null;

  return {
    step,
    count,
    market,
    device,
    accountState,
    observedAt,
    source: aggregateSource
  };
}

export function recordSearchToSavingsFunnelEvents(values: unknown[]) {
  const observedAt = new Date().toISOString();
  const normalized = values
    .map((value) => normalizeIncomingFunnelEvent(value, observedAt))
    .filter((event): event is SearchToSavingsFunnelEvent => event !== null);

  for (const event of normalized) {
    const key = bucketKey(event);
    const existing = aggregateBuckets.get(key);
    aggregateBuckets.set(key, {
      ...event,
      count: (existing?.count ?? 0) + event.count,
      observedAt
    });
  }

  return {
    accepted: normalized.length,
    rejected: values.length - normalized.length
  };
}

export function getSearchToSavingsFunnelDashboard() {
  return buildSearchToSavingsFunnelDashboard([...aggregateBuckets.values()]);
}

export function resetSearchToSavingsFunnelDashboardForTests() {
  aggregateBuckets.clear();
}
