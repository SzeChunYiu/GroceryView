// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { buildScreenerQuery, runScreenerQuery } from '../query-builder';

const fixtureRows = [
  { id: 'milk-ica', price: 18, discount_percent: 12, category: 'dairy', chain: 'ica' },
  { id: 'bread-coop', price: 24, discount_percent: 20, category: 'bakery', chain: 'coop' },
  { id: 'cheese-willys', price: 55, discount_percent: 8, category: 'dairy', chain: 'willys' },
];

describe('buildScreenerQuery', () => {
  it('builds the base query without filters', () => {
    expect(buildScreenerQuery({})).toEqual({
      sql: 'select * from screener_rows order by discount_percent desc',
      params: [],
    });
  });

  it('combines price range, discount, category, and chain filters', () => {
    expect(buildScreenerQuery({ minPrice: 10, maxPrice: 30, minDiscount: 15, category: 'bakery', chain: 'coop' })).toEqual({
      sql: 'select * from screener_rows where price >= $1 and price <= $2 and discount_percent >= $3 and category = $4 and chain = $5 order by discount_percent desc',
      params: [10, 30, 15, 'bakery', 'coop'],
    });
  });

  it.each([
    [{ minPrice: 20 }, 'price >= $1'],
    [{ maxPrice: 30 }, 'price <= $1'],
    [{ minDiscount: 10 }, 'discount_percent >= $1'],
    [{ category: 'dairy' }, 'category = $1'],
    [{ chain: 'ica' }, 'chain = $1'],
  ])('supports single filter %#', (filters, clause) => {
    expect(buildScreenerQuery(filters).sql).toContain(clause);
  });
});

describe('runScreenerQuery', () => {
  it('passes SQL and params to a mocked DB query function', async () => {
    const dbQuery = vi.fn(async (_sql, params) => fixtureRows.filter((row) => row.price >= params[0] && row.chain === params[1]));

    const rows = await runScreenerQuery({ minPrice: 20, chain: 'coop' }, dbQuery);

    expect(dbQuery).toHaveBeenCalledWith(
      'select * from screener_rows where price >= $1 and chain = $2 order by discount_percent desc',
      [20, 'coop'],
    );
    expect(rows).toEqual([fixtureRows[1]]);
  });
});
