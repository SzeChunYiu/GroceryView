import { describe, expect, it, vi } from 'vitest';
import { applyScreenerFilters, buildScreenerQuery, runScreenerQuery, type ScreenerProductRow } from '../query-builder';

const fixtureRows: ScreenerProductRow[] = [
  { id: 'milk-ica', name: 'Milk 1L', category: 'dairy', chain: 'ica', price: 14.9, regularPrice: 16.9, discountPercent: 12 },
  { id: 'oats-willys', name: 'Oats 1kg', category: 'pantry', chain: 'willys', price: 21.9, regularPrice: 29.9, discountPercent: 27 },
  { id: 'coffee-coop', name: 'Coffee 450g', category: 'pantry', chain: 'coop', price: 49.9, regularPrice: 69.9, discountPercent: 29 },
  { id: 'bread-lidl', name: 'Bread 500g', category: 'bread', chain: 'lidl', price: 24.5, regularPrice: 24.5, discountPercent: 0 }
];

function mockDbQuery() {
  return vi.fn(async (plan: ReturnType<typeof buildScreenerQuery>) => applyScreenerFilters(fixtureRows, plan.filters));
}

describe('screener query builder', () => {
  it.each([
    ['no filters', {}, ['milk-ica', 'oats-willys', 'coffee-coop', 'bread-lidl']],
    ['price range', { minPrice: 20, maxPrice: 30 }, ['oats-willys', 'bread-lidl']],
    ['discount floor', { minDiscountPercent: 20 }, ['oats-willys', 'coffee-coop']],
    ['category', { category: 'pantry' }, ['oats-willys', 'coffee-coop']],
    ['chain', { chain: 'lidl' }, ['bread-lidl']],
    ['price discount category chain', { minPrice: 20, maxPrice: 60, minDiscountPercent: 25, category: 'pantry', chain: 'coop' }, ['coffee-coop']]
  ])('filters fixture rows for %s', async (_label, filters, expectedIds) => {
    const query = mockDbQuery();
    const rows = await runScreenerQuery(filters, query);

    expect(rows.map((row) => row.id)).toEqual(expectedIds);
    expect(query).toHaveBeenCalledOnce();
  });

  it('emits stable DB predicates and params for every filter combination', () => {
    expect(buildScreenerQuery({ minPrice: 20, maxPrice: 60, minDiscountPercent: 25, category: 'pantry', chain: 'coop' })).toEqual({
      where: ['price >= :minPrice', 'price <= :maxPrice', 'discount_percent >= :minDiscountPercent', 'category = :category', 'chain = :chain'],
      params: { minPrice: 20, maxPrice: 60, minDiscountPercent: 25, category: 'pantry', chain: 'coop' },
      filters: { minPrice: 20, maxPrice: 60, minDiscountPercent: 25, category: 'pantry', chain: 'coop' }
    });
  });
});
