export type BudgetProfileId = 'balanced' | 'tight-budget' | 'value-focused';

type AdaptivePriceSignal = {
  cheapestPriceLabel?: string;
  currentPriceLabel?: string;
  dealScore?: number;
  discountLabel?: string;
  unitPriceLabel?: string;
};

export type AdaptiveSortPreset = {
  id: BudgetProfileId;
  label: string;
  description: string;
  weights: {
    discount: number;
    absoluteCost: number;
    unitEfficiency: number;
  };
};

const balancedAdaptiveSortPreset: AdaptiveSortPreset = {
  id: 'balanced',
  label: 'Balanced default',
  description: 'Balances deal signals, shelf price, and comparable unit value.',
  weights: { discount: 0.34, absoluteCost: 0.33, unitEfficiency: 0.33 }
};

export const adaptiveSortPresets: AdaptiveSortPreset[] = [
  balancedAdaptiveSortPreset,
  {
    id: 'tight-budget',
    label: 'Tight budget',
    description: 'Prioritizes the lowest shelf price while still rewarding verified discounts.',
    weights: { discount: 0.35, absoluteCost: 0.5, unitEfficiency: 0.15 }
  },
  {
    id: 'value-focused',
    label: 'Value focused',
    description: 'Prioritizes comparable kr/kg, kr/l, and per-unit efficiency for stock-up trips.',
    weights: { discount: 0.25, absoluteCost: 0.2, unitEfficiency: 0.55 }
  }
];

export function getAdaptiveSortPreset(profile?: string | string[]): AdaptiveSortPreset {
  const requested = Array.isArray(profile) ? profile[0] : profile;
  return adaptiveSortPresets.find((preset) => preset.id === requested) ?? balancedAdaptiveSortPreset;
}

function parseFirstNumber(value?: string) {
  const match = value?.match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number.parseFloat(match[0].replace(',', '.')) : undefined;
}

function normalizeLowerIsBetter(value: number | undefined, values: number[]) {
  if (value === undefined || values.length === 0) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return 1;
  return 1 - (value - min) / (max - min);
}

function normalizeHigherIsBetter(value: number | undefined, values: number[]) {
  if (value === undefined || values.length === 0) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return 1;
  return (value - min) / (max - min);
}

export function sortByAdaptivePriceSensitivity<T extends AdaptivePriceSignal>(items: readonly T[], preset: AdaptiveSortPreset) {
  const signals = items.map((item, index) => {
    const absoluteCost = parseFirstNumber(item.cheapestPriceLabel ?? item.currentPriceLabel);
    const discount = parseFirstNumber(item.discountLabel) ?? item.dealScore;
    const unitEfficiency = parseFirstNumber(item.unitPriceLabel);
    return { index, item, absoluteCost, discount, unitEfficiency };
  });
  const absoluteCosts = signals.map((signal) => signal.absoluteCost).filter((value): value is number => value !== undefined);
  const discounts = signals.map((signal) => signal.discount).filter((value): value is number => value !== undefined);
  const unitEfficiencies = signals.map((signal) => signal.unitEfficiency).filter((value): value is number => value !== undefined);

  return signals
    .map((signal) => ({
      ...signal,
      score:
        normalizeHigherIsBetter(signal.discount, discounts) * preset.weights.discount +
        normalizeLowerIsBetter(signal.absoluteCost, absoluteCosts) * preset.weights.absoluteCost +
        normalizeLowerIsBetter(signal.unitEfficiency, unitEfficiencies) * preset.weights.unitEfficiency
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((signal) => signal.item);
}
