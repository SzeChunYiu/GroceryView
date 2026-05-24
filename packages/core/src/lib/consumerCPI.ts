export type ConsumerPriceObservation = {
  productId: string;
  observedAt: string;
  price: number;
  quantity?: number;
};

export type OfficialMonthlyCpi = {
  sourceId: 'SCB' | 'SSB' | 'HAGSTOFA';
  country: 'SE' | 'NO' | 'IS';
  period: string;
  value: number;
};

export type WeeklyConsumerCpiRow = {
  weekStart: string;
  index: number;
  pricedProducts: number;
  missingProductIds: string[];
  officialIndex: number | null;
  officialSourceId: OfficialMonthlyCpi['sourceId'] | null;
  divergence: number | null;
};

export type ConsumerCpiResult = {
  baseWeek: string;
  currentWeek: string;
  currentIndex: number;
  currentOfficialIndex: number | null;
  currentDivergence: number | null;
  rows: WeeklyConsumerCpiRow[];
};

export function computeWeeklyFoodCPI(input: {
  observations: readonly ConsumerPriceObservation[];
  officialMonthly: readonly OfficialMonthlyCpi[];
}): ConsumerCpiResult {
  const weeklyPrices = new Map<string, Map<string, number[]>>();
  const productIds = new Set<string>();

  for (const observation of input.observations) {
    if (!observation.productId || !Number.isFinite(observation.price) || observation.price <= 0) continue;
    const week = weekStart(observation.observedAt);
    if (!week) continue;
    productIds.add(observation.productId);
    const productPrices = weeklyPrices.get(week) ?? new Map<string, number[]>();
    const prices = productPrices.get(observation.productId) ?? [];
    prices.push(observation.price);
    productPrices.set(observation.productId, prices);
    weeklyPrices.set(week, productPrices);
  }

  const weeks = [...weeklyPrices.keys()].sort();
  if (weeks.length === 0) throw new Error('At least one priced weekly observation is required.');
  const baseWeek = weeks[0]!;
  const basePrices = averagePrices(weeklyPrices.get(baseWeek)!);
  const officialByMonth = new Map(input.officialMonthly.map((row) => [row.period, row]));
  const baseOfficial = officialByMonth.get(baseWeek.slice(0, 7));

  const rows = weeks.map((week) => {
    const prices = averagePrices(weeklyPrices.get(week)!);
    const indexedProducts = [...basePrices.entries()]
      .map(([productId, basePrice]) => ({ productId, index: prices.has(productId) ? (prices.get(productId)! / basePrice) * 100 : null }))
      .filter((row): row is { productId: string; index: number } => row.index !== null && Number.isFinite(row.index));
    const missingProductIds = [...productIds].filter((productId) => !prices.has(productId));
    const index = round(indexedProducts.reduce((sum, row) => sum + row.index, 0) / indexedProducts.length);
    const official = officialByMonth.get(week.slice(0, 7)) ?? null;
    const officialIndex = official && baseOfficial ? round((official.value / baseOfficial.value) * 100) : null;
    return {
      weekStart: week,
      index,
      pricedProducts: indexedProducts.length,
      missingProductIds,
      officialIndex,
      officialSourceId: official?.sourceId ?? null,
      divergence: officialIndex === null ? null : round(index - officialIndex)
    };
  });

  const current = rows[rows.length - 1]!;
  return {
    baseWeek,
    currentWeek: current.weekStart,
    currentIndex: current.index,
    currentOfficialIndex: current.officialIndex,
    currentDivergence: current.divergence,
    rows
  };
}

function averagePrices(pricesByProduct: Map<string, number[]>): Map<string, number> {
  return new Map([...pricesByProduct.entries()].map(([productId, prices]) => [
    productId,
    prices.reduce((sum, price) => sum + price, 0) / prices.length
  ]));
}

function weekStart(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
