import { siteUrl } from '@/lib/seo';

export type GroceryIndexTickerWidget = {
  route: '/widgets/grocery-index-ticker';
  title: string;
  sourceConfidence: Record<'high' | 'medium' | 'low', number>;
  embedCode: string;
};

export type GroceryIndexMarketComparison = {
  window: 'last-month' | 'last-quarter';
  label: string;
  marketIndexChangePercent: number;
  source: 'grocery-index-observed-chain-basket';
};

export function buildGroceryIndexTickerWidget(sourceConfidence: Record<'high' | 'medium' | 'low', number>): GroceryIndexTickerWidget {
  return {
    route: '/widgets/grocery-index-ticker',
    title: 'Embeddable Grocery Index ticker',
    sourceConfidence,
    embedCode: `<iframe src="${siteUrl}/widgets/grocery-index-ticker" title="Grocery Index ticker" loading="lazy" width="100%" height="320"></iframe>`
  };
}

export const groceryIndexTickerWidget = buildGroceryIndexTickerWidget({ high: 0, medium: 0, low: 0 });

export const groceryIndexMarketComparisons: GroceryIndexMarketComparison[] = [
  { window: 'last-month', label: 'Grocery Index last month', marketIndexChangePercent: 1.7, source: 'grocery-index-observed-chain-basket' },
  { window: 'last-quarter', label: 'Grocery Index last quarter', marketIndexChangePercent: 4.8, source: 'grocery-index-observed-chain-basket' }
];
