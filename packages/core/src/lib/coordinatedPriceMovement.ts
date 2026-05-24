export type CoordinatedPriceObservation = {
  sku: string;
  productName: string;
  chainId: string;
  observedAt: string;
  price: number;
  sourceLabel?: string;
  sourceConfidence?: number;
};

export type PriceMovementDirection = 'up' | 'down';

export type ChainPriceMovement = {
  sku: string;
  productName: string;
  chainId: string;
  weekStart: string;
  direction: PriceMovementDirection;
  previousObservedAt: string;
  currentObservedAt: string;
  previousPrice: number;
  currentPrice: number;
  changePercent: number;
  sourceLabel?: string;
  sourceConfidence?: number;
};

export type CoordinatedPriceMovementSignal = {
  sku: string;
  productName: string;
  weekStart: string;
  direction: PriceMovementDirection;
  chainCount: number;
  chains: string[];
  averageAbsoluteChangePercent: number;
  maxAbsoluteChangePercent: number;
  confidence: 'low' | 'medium' | 'high';
  researchGradeCopy: string;
  movements: ChainPriceMovement[];
};

export type CoordinatedPriceMovementOptions = {
  minimumChangePercent?: number;
  minimumChains?: number;
};

type ParsedObservation = CoordinatedPriceObservation & { observedAtMs: number };

const DAY_MS = 24 * 60 * 60 * 1000;

export function detectCoordinatedPriceMovements(
  observations: readonly CoordinatedPriceObservation[],
  options: CoordinatedPriceMovementOptions = {}
): CoordinatedPriceMovementSignal[] {
  const minimumChangePercent = options.minimumChangePercent ?? 5;
  const minimumChains = options.minimumChains ?? 2;
  const parsed = observations
    .map((observation): ParsedObservation | null => {
      const observedAtMs = Date.parse(observation.observedAt);
      if (
        !observation.sku.trim() ||
        !observation.productName.trim() ||
        !observation.chainId.trim() ||
        !Number.isFinite(observedAtMs) ||
        !Number.isFinite(observation.price) ||
        observation.price <= 0
      ) {
        return null;
      }
      return { ...observation, observedAtMs };
    })
    .filter((observation): observation is ParsedObservation => observation !== null);

  const bySkuAndChain = new Map<string, ParsedObservation[]>();
  for (const observation of parsed) {
    const key = `${observation.sku}::${observation.chainId}`;
    const rows = bySkuAndChain.get(key) ?? [];
    rows.push(observation);
    bySkuAndChain.set(key, rows);
  }

  const movements: ChainPriceMovement[] = [];
  for (const rows of bySkuAndChain.values()) {
    const sorted = rows.sort((a, b) => a.observedAtMs - b.observedAtMs);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const changePercent = ((current.price - previous.price) / previous.price) * 100;
      if (Math.abs(changePercent) < minimumChangePercent) continue;
      movements.push({
        sku: current.sku,
        productName: current.productName,
        chainId: current.chainId,
        weekStart: isoWeekStart(current.observedAtMs),
        direction: changePercent >= 0 ? 'up' : 'down',
        previousObservedAt: previous.observedAt,
        currentObservedAt: current.observedAt,
        previousPrice: round(previous.price),
        currentPrice: round(current.price),
        changePercent: round(changePercent),
        sourceLabel: current.sourceLabel,
        sourceConfidence: current.sourceConfidence
      });
    }
  }

  const groups = new Map<string, ChainPriceMovement[]>();
  for (const movement of movements) {
    const key = `${movement.sku}::${movement.weekStart}::${movement.direction}`;
    const rows = groups.get(key) ?? [];
    rows.push(movement);
    groups.set(key, rows);
  }

  const signals: CoordinatedPriceMovementSignal[] = [];
  for (const rows of groups.values()) {
    const strongestMovementByChain = new Map<string, ChainPriceMovement>();
    for (const movement of rows) {
      const existing = strongestMovementByChain.get(movement.chainId);
      if (!existing || Math.abs(movement.changePercent) > Math.abs(existing.changePercent)) {
        strongestMovementByChain.set(movement.chainId, movement);
      }
    }

    const deduped = [...strongestMovementByChain.values()].sort((a, b) => a.chainId.localeCompare(b.chainId));
    if (deduped.length < minimumChains) continue;

    const absoluteChanges = deduped.map((movement) => Math.abs(movement.changePercent));
    const averageAbsoluteChangePercent = round(absoluteChanges.reduce((sum, value) => sum + value, 0) / absoluteChanges.length);
    const maxAbsoluteChangePercent = round(Math.max(...absoluteChanges));
    const first = deduped[0];
    const chains = deduped.map((movement) => movement.chainId);

    signals.push({
      sku: first.sku,
      productName: first.productName,
      weekStart: first.weekStart,
      direction: first.direction,
      chainCount: chains.length,
      chains,
      averageAbsoluteChangePercent,
      maxAbsoluteChangePercent,
      confidence: confidenceFor(deduped),
      researchGradeCopy: researchGradeCopy(first.direction, chains.length, averageAbsoluteChangePercent),
      movements: deduped
    });
  }

  return signals.sort((a, b) => {
    const chainDelta = b.chainCount - a.chainCount;
    if (chainDelta !== 0) return chainDelta;
    return b.averageAbsoluteChangePercent - a.averageAbsoluteChangePercent;
  });
}

export function isoWeekStart(observedAtMs: number): string {
  const date = new Date(observedAtMs);
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const day = new Date(utcMidnight).getUTCDay() || 7;
  return new Date(utcMidnight - (day - 1) * DAY_MS).toISOString().slice(0, 10);
}

function confidenceFor(movements: ChainPriceMovement[]): CoordinatedPriceMovementSignal['confidence'] {
  const minimumSourceConfidence = Math.min(...movements.map((movement) => movement.sourceConfidence ?? 0.5));
  if (movements.length >= 3 && minimumSourceConfidence >= 0.8) return 'high';
  if (minimumSourceConfidence >= 0.6) return 'medium';
  return 'low';
}

function researchGradeCopy(direction: PriceMovementDirection, chainCount: number, averageAbsoluteChangePercent: number): string {
  return `${chainCount} chains moved the same SKU ${direction} by an average ${averageAbsoluteChangePercent.toFixed(1)}% in the same ISO week. This is a research-grade coordination signal, not an accusation or proof of intent.`;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
