import type { ChainCategoryIndex, ChainPriceIndex } from '@groceryview/core';

export const categoryIndexMatchers: Record<string, string[]> = {
  alcohol: ['Beverages'],
  baby: ['Baby'],
  beverages: ['Beverages'],
  bread: ['Bread & bakery'],
  breakfast: ['Coffee & tea', 'Dairy & eggs', 'Pantry & dry'],
  'coffee-tea': ['Coffee & tea'],
  dairy: ['Dairy & eggs'],
  fish: ['Meat & fish'],
  frozen: ['Frozen'],
  household: ['Household'],
  meat: ['Meat & fish'],
  pantry: ['Pantry & dry'],
  'personal-care': ['Personal care'],
  pet: ['Pet'],
  'plant-based': ['Dairy & eggs', 'Pantry & dry'],
  produce: ['Fruit & veg'],
  snacks: ['Snacks & sweets'],
  sweets: ['Snacks & sweets']
};

export type HeatmapCell = {
  index: number;
  observations: number;
  confidence: 'high' | 'medium' | 'low';
  estimated: boolean;
};

export function matchedCategoryCells(chain: ChainPriceIndex, categorySlug: string): ChainCategoryIndex[] {
  const matchers = categoryIndexMatchers[categorySlug] ?? [];
  return chain.byCategory.filter((category) => matchers.some((matcher) => category.category.startsWith(matcher)));
}

export function weightedCellIndex(chain: ChainPriceIndex, categorySlug: string): HeatmapCell | null {
  const matches = matchedCategoryCells(chain, categorySlug);
  const observations = matches.reduce((sum, category) => sum + category.observations, 0);
  if (matches.length === 0 || observations === 0) return null;

  const index = matches.reduce((sum, category) => sum + category.index * category.observations, 0) / observations;
  const confidence = observations >= 12 ? 'high' : observations >= 4 ? 'medium' : 'low';
  return {
    index,
    observations,
    confidence,
    estimated: matches.some((category) => category.estimated)
  };
}

export function indexSymbol(chainId: string, categorySlug: string) {
  return `${chainId}-${categorySlug}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
