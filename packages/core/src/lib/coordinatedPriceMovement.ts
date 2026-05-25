export type PriceMovementObservation = {
  chainId: string;
  observedAt: string | Date;
  price: number;
  sku: string;
};

export type CoordinatedPriceMovementOptions = {
  minChains?: number;
  thresholdPercent?: number;
};

export type ChainPriceMovement = {
  chainId: string;
  direction: 'increase' | 'decrease';
  fromPrice: number;
  observedAt: string;
  percentChange: number;
  sku: string;
  toPrice: number;
  weekStart: string;
};

export type CoordinatedPriceMovementSignal = {
  chainCount: number;
  direction: 'increase' | 'decrease';
  disclaimer: string;
  movements: ChainPriceMovement[];
  researchSignal: true;
  sku: string;
  thresholdPercent: number;
  weekStart: string;
};

const defaultThresholdPercent = 5;
const defaultMinChains = 2;

function toDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isoWeekStart(value: string | Date) {
  const date = toDate(value);
  if (!date) return null;

  const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcMidnight.getUTCDay() || 7;
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - day + 1);
  return utcMidnight.toISOString().slice(0, 10);
}

function movementDirection(percentChange: number): ChainPriceMovement['direction'] {
  return percentChange >= 0 ? 'increase' : 'decrease';
}

function validObservation(observation: PriceMovementObservation) {
  return (
    observation.sku.trim().length > 0
    && observation.chainId.trim().length > 0
    && Number.isFinite(observation.price)
    && observation.price > 0
    && toDate(observation.observedAt) !== null
  );
}

function movementKey(movement: Pick<ChainPriceMovement, 'direction' | 'sku' | 'weekStart'>) {
  return `${movement.sku}::${movement.weekStart}::${movement.direction}`;
}

export function detectCoordinatedPriceMovements(
  observations: readonly PriceMovementObservation[],
  options: CoordinatedPriceMovementOptions = {},
): CoordinatedPriceMovementSignal[] {
  const thresholdPercent = Math.max(0, options.thresholdPercent ?? defaultThresholdPercent);
  const minChains = Math.max(2, Math.floor(options.minChains ?? defaultMinChains));
  const bySkuAndChain = new Map<string, PriceMovementObservation[]>();

  for (const observation of observations) {
    if (!validObservation(observation)) continue;
    const key = `${observation.sku}::${observation.chainId}`;
    bySkuAndChain.set(key, [...(bySkuAndChain.get(key) ?? []), observation]);
  }

  const groupedMovements = new Map<string, ChainPriceMovement[]>();

  for (const chainObservations of bySkuAndChain.values()) {
    const sorted = [...chainObservations].sort((left, right) => {
      return toDate(left.observedAt)!.getTime() - toDate(right.observedAt)!.getTime();
    });

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (!previous || !current) continue;
      const percentChange = ((current.price - previous.price) / previous.price) * 100;

      if (Math.abs(percentChange) < thresholdPercent) continue;

      const weekStart = isoWeekStart(current.observedAt);
      if (!weekStart) continue;

      const movement: ChainPriceMovement = {
        chainId: current.chainId,
        direction: movementDirection(percentChange),
        fromPrice: previous.price,
        observedAt: toDate(current.observedAt)!.toISOString(),
        percentChange,
        sku: current.sku,
        toPrice: current.price,
        weekStart,
      };
      const key = movementKey(movement);
      groupedMovements.set(key, [...(groupedMovements.get(key) ?? []), movement]);
    }
  }

  return [...groupedMovements.values()]
    .map((movements) => {
      const chainMap = new Map<string, ChainPriceMovement>();
      for (const movement of movements) {
        const existing = chainMap.get(movement.chainId);
        if (!existing || Math.abs(movement.percentChange) > Math.abs(existing.percentChange)) {
          chainMap.set(movement.chainId, movement);
        }
      }
      return [...chainMap.values()];
    })
    .flatMap((movements) => {
      if (movements.length < minChains) return [];
      const [first] = movements;
      if (!first) return [];

      return [{
        chainCount: movements.length,
        direction: first.direction,
        disclaimer: 'Research-grade coordinated price movement signal only; this is not an accusation or evidence of price fixing.',
        movements: movements.sort((left, right) => Math.abs(right.percentChange) - Math.abs(left.percentChange)),
        researchSignal: true as const,
        sku: first.sku,
        thresholdPercent,
        weekStart: first.weekStart,
      }];
    })
    .sort((left, right) => right.chainCount - left.chainCount || left.sku.localeCompare(right.sku));
}
