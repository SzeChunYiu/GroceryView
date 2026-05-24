export type ChainConfidenceObservation = {
  chain: string;
  country: string;
  observedAt?: string | null;
  sku?: string | null;
  storeId?: string | null;
};

export type PerChainConfidenceRow = {
  chain: string;
  country: string;
  lastObservedAt: string | null;
  observationsLast7d: number;
  skuCount: number;
  storeCount: number;
};

export function buildPerChainConfidenceRows(
  observations: readonly ChainConfidenceObservation[],
  options: { asOf?: string | Date } = {}
): PerChainConfidenceRow[] {
  const asOf = options.asOf ? new Date(options.asOf) : latestObservedDate(observations) ?? new Date();
  const sevenDaysAgo = asOf.getTime() - 7 * 24 * 60 * 60 * 1000;
  const groups = new Map<string, {
    chain: string;
    country: string;
    lastObservedAt: string | null;
    observationsLast7d: number;
    skus: Set<string>;
    stores: Set<string>;
  }>();

  for (const observation of observations) {
    const country = observation.country.trim().toUpperCase();
    const chain = observation.chain.trim();
    if (!country || !chain) continue;
    const key = `${country}:${chain.toLowerCase()}`;
    const group = groups.get(key) ?? {
      chain,
      country,
      lastObservedAt: null,
      observationsLast7d: 0,
      skus: new Set<string>(),
      stores: new Set<string>()
    };

    if (observation.sku) group.skus.add(observation.sku);
    if (observation.storeId) group.stores.add(observation.storeId);
    if (observation.observedAt) {
      const observedAt = new Date(observation.observedAt);
      if (!Number.isNaN(observedAt.getTime())) {
        if (!group.lastObservedAt || observation.observedAt > group.lastObservedAt) group.lastObservedAt = observation.observedAt;
        if (observedAt.getTime() >= sevenDaysAgo && observedAt.getTime() <= asOf.getTime()) group.observationsLast7d += 1;
      }
    }

    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({
      chain: group.chain,
      country: group.country,
      lastObservedAt: group.lastObservedAt,
      observationsLast7d: group.observationsLast7d,
      skuCount: group.skus.size,
      storeCount: group.stores.size
    }))
    .sort((left, right) => left.country.localeCompare(right.country) || left.chain.localeCompare(right.chain));
}

function latestObservedDate(observations: readonly ChainConfidenceObservation[]): Date | null {
  const times = observations
    .map((observation) => observation.observedAt ? new Date(observation.observedAt).getTime() : Number.NaN)
    .filter((time) => Number.isFinite(time));
  return times.length ? new Date(Math.max(...times)) : null;
}
