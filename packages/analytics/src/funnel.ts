export const searchToSavingsFunnelSteps = [
  {
    id: 'landing_search',
    label: 'Landing/search',
    detail: 'Visitor reaches the landing surface or runs product search.'
  },
  {
    id: 'product_view',
    label: 'Product',
    detail: 'Visitor opens a verified product detail page.'
  },
  {
    id: 'compare_view',
    label: 'Compare',
    detail: 'Visitor opens a chain or item comparison surface.'
  },
  {
    id: 'watchlist_alert',
    label: 'Watchlist/alert',
    detail: 'Visitor reaches a watchlist or price-alert action surface.'
  },
  {
    id: 'basket_view',
    label: 'Basket',
    detail: 'Visitor opens a basket or shopping-list planning surface.'
  },
  {
    id: 'savings_action',
    label: 'Savings action',
    detail: 'Visitor reaches a savings dashboard or savings CTA surface.'
  }
] as const;

export type SearchToSavingsFunnelStepId = typeof searchToSavingsFunnelSteps[number]['id'];
export type FunnelDeviceSegment = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export type FunnelAccountSegment = 'guest' | 'account' | 'unknown';

export type SearchToSavingsFunnelEvent = {
  step: SearchToSavingsFunnelStepId;
  count: number;
  market: string;
  device: FunnelDeviceSegment;
  accountState: FunnelAccountSegment;
  observedAt: string;
  source: string;
};

export type FunnelStepRollup = {
  id: SearchToSavingsFunnelStepId;
  label: string;
  detail: string;
  count: number;
  conversionFromPrevious: number | null;
  dropOffFromPrevious: number | null;
  dropOffCountFromPrevious: number | null;
};

export type FunnelSegmentRollup = {
  key: string;
  market: string;
  device: FunnelDeviceSegment;
  accountState: FunnelAccountSegment;
  entryCount: number;
  savingsActionCount: number;
  completionRate: number;
  largestDropOffStep: SearchToSavingsFunnelStepId | null;
  largestDropOffPercent: number | null;
};

export type SearchToSavingsFunnelDashboard = {
  available: boolean;
  generatedAt: string;
  observationCount: number;
  sourceCount: number;
  sources: string[];
  latestObservedAt: string | null;
  steps: FunnelStepRollup[];
  segments: FunnelSegmentRollup[];
  largestDropOff: {
    from: SearchToSavingsFunnelStepId;
    to: SearchToSavingsFunnelStepId;
    count: number;
    percent: number;
  } | null;
  guardrail: string;
  privacy: string;
};

const stepOrder = new Map<SearchToSavingsFunnelStepId, number>(
  searchToSavingsFunnelSteps.map((step, index) => [step.id, index])
);

function isValidEvent(event: SearchToSavingsFunnelEvent) {
  return stepOrder.has(event.step)
    && Number.isInteger(event.count)
    && event.count > 0
    && event.market.trim().length > 0
    && event.source.trim().length > 0
    && Number.isFinite(Date.parse(event.observedAt));
}

function safeRatio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function segmentKey(event: Pick<SearchToSavingsFunnelEvent, 'accountState' | 'device' | 'market'>) {
  return `${event.market}::${event.device}::${event.accountState}`;
}

function largestDropOffForCounts(counts: Map<SearchToSavingsFunnelStepId, number>) {
  let largest: SearchToSavingsFunnelDashboard['largestDropOff'] = null;

  for (let index = 1; index < searchToSavingsFunnelSteps.length; index += 1) {
    const from = searchToSavingsFunnelSteps[index - 1]!.id;
    const to = searchToSavingsFunnelSteps[index]!.id;
    const previous = counts.get(from) ?? 0;
    const current = counts.get(to) ?? 0;
    if (previous <= 0) continue;
    const dropOffCount = Math.max(0, previous - current);
    const dropOffPercent = dropOffCount / previous;

    if (!largest || dropOffPercent > largest.percent) {
      largest = { from, to, count: dropOffCount, percent: dropOffPercent };
    }
  }

  return largest;
}

export function buildSearchToSavingsFunnelDashboard(
  events: SearchToSavingsFunnelEvent[],
  generatedAt = new Date().toISOString()
): SearchToSavingsFunnelDashboard {
  const validEvents = events.filter(isValidEvent);
  const counts = new Map<SearchToSavingsFunnelStepId, number>();
  const sourceSet = new Set<string>();
  let latestObservedAt: string | null = null;

  for (const event of validEvents) {
    counts.set(event.step, (counts.get(event.step) ?? 0) + event.count);
    sourceSet.add(event.source);
    if (!latestObservedAt || Date.parse(event.observedAt) > Date.parse(latestObservedAt)) {
      latestObservedAt = event.observedAt;
    }
  }

  const steps = searchToSavingsFunnelSteps.map((step, index): FunnelStepRollup => {
    const count = counts.get(step.id) ?? 0;
    const previous = index > 0 ? (counts.get(searchToSavingsFunnelSteps[index - 1]!.id) ?? 0) : 0;
    const dropOffCount = index > 0 ? Math.max(0, previous - count) : null;

    return {
      id: step.id,
      label: step.label,
      detail: step.detail,
      count,
      conversionFromPrevious: index > 0 ? safeRatio(count, previous) : null,
      dropOffFromPrevious: index > 0 && previous > 0 && dropOffCount !== null ? dropOffCount / previous : null,
      dropOffCountFromPrevious: dropOffCount
    };
  });

  const segmentCounts = new Map<string, {
    market: string;
    device: FunnelDeviceSegment;
    accountState: FunnelAccountSegment;
    counts: Map<SearchToSavingsFunnelStepId, number>;
  }>();

  for (const event of validEvents) {
    const key = segmentKey(event);
    const current = segmentCounts.get(key) ?? {
      market: event.market,
      device: event.device,
      accountState: event.accountState,
      counts: new Map<SearchToSavingsFunnelStepId, number>()
    };
    current.counts.set(event.step, (current.counts.get(event.step) ?? 0) + event.count);
    segmentCounts.set(key, current);
  }

  const segments = [...segmentCounts.entries()]
    .map(([key, segment]): FunnelSegmentRollup => {
      const entryCount = segment.counts.get('landing_search') ?? 0;
      const savingsActionCount = segment.counts.get('savings_action') ?? 0;
      const largestDropOff = largestDropOffForCounts(segment.counts);

      return {
        key,
        market: segment.market,
        device: segment.device,
        accountState: segment.accountState,
        entryCount,
        savingsActionCount,
        completionRate: entryCount > 0 ? savingsActionCount / entryCount : 0,
        largestDropOffStep: largestDropOff?.to ?? null,
        largestDropOffPercent: largestDropOff?.percent ?? null
      };
    })
    .sort((left, right) => right.entryCount - left.entryCount || left.key.localeCompare(right.key));

  return {
    available: validEvents.length > 0 && (counts.get('landing_search') ?? 0) > 0,
    generatedAt,
    observationCount: validEvents.reduce((sum, event) => sum + event.count, 0),
    sourceCount: sourceSet.size,
    sources: [...sourceSet].sort(),
    latestObservedAt,
    steps,
    segments,
    largestDropOff: largestDropOffForCounts(counts),
    guardrail: 'Only aggregate step counts by market, device, and guest/account state are accepted; product ids, user ids, prices, and free-text search terms are not part of the funnel payload.',
    privacy: 'The funnel is intentionally segment-level and cannot identify a shopper or reconstruct an individual journey.'
  };
}
