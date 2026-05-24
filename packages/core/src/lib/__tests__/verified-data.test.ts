// @ts-ignore Vitest is supplied by the test runner for this ticketed spec.
import { describe, expect, it } from 'vitest';

type ItemComparisonView = {
  maxItems: number;
  requestedItemIds: string[];
  missingItemIds: string[];
  truncatedItemIds: string[];
  sourceLabel: string;
  items: Array<{
    slug: string;
    name: string;
    storePrices: Array<{ storeName: string; price: number; priceLabel: string }>;
    trendPoints: Array<{ label: string; price: number; priceLabel: string }>;
  }>;
};

const verifiedData = await import(new URL('../../../../../apps/web/src/lib/verified-data.ts', import.meta.url).href) as {
  MAX_ITEM_COMPARISON_ITEMS: number;
  productUniverse: Array<{ slug: string }>;
  buildItemComparisonView(searchParams?: { items?: string | string[] }): ItemComparisonView;
};

const fixtureSlugs = [...new Set(verifiedData.productUniverse.map((product) => product.slug))];

describe('verified-data item comparison view', () => {
  it('builds a comparison from real fixture products', () => {
    const requestedSlugs = fixtureSlugs.slice(0, 2);
    const view = verifiedData.buildItemComparisonView({ items: requestedSlugs.join(',') });

    expect(view.requestedItemIds).toEqual(requestedSlugs);
    expect(view.missingItemIds).toEqual([]);
    expect(view.truncatedItemIds).toEqual([]);
    expect(view.items.map((item) => item.slug)).toEqual(requestedSlugs);
    expect(view.items[0]?.storePrices.length).toBeGreaterThan(0);
    expect(view.items[0]?.trendPoints.length).toBeGreaterThan(0);
  });

  it('falls back to default fixture products for empty input', () => {
    const view = verifiedData.buildItemComparisonView({ items: '' });

    expect(view.requestedItemIds).toEqual([]);
    expect(view.missingItemIds).toEqual([]);
    expect(view.items.length).toBeGreaterThan(0);
    expect(view.items.length).toBeLessThanOrEqual(verifiedData.MAX_ITEM_COMPARISON_ITEMS);
    expect(view.items.every((item) => item.name.length > 0)).toBe(true);
  });

  it('reports malformed or missing fixture ids without dropping valid products', () => {
    const validSlug = fixtureSlugs[0];
    const view = verifiedData.buildItemComparisonView({ items: [validSlug, 'missing-verified-fixture', '  ', ',,'] });

    expect(view.requestedItemIds).toEqual([validSlug, 'missing-verified-fixture']);
    expect(view.missingItemIds).toEqual(['missing-verified-fixture']);
    expect(view.items.map((item) => item.slug)).toEqual([validSlug]);
    expect(view.truncatedItemIds).toEqual([]);
  });
});

export {};
