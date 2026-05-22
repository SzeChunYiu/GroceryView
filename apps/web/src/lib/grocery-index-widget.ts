import { siteUrl } from '@/lib/seo';

export type GroceryIndexTickerWidget = {
  route: '/widgets/grocery-index-ticker';
  title: string;
  sourceConfidence: Record<'high' | 'medium' | 'low', number>;
  embedCode: string;
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
