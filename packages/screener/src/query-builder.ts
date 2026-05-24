export type ScreenerFilters = {
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  category?: string;
  chain?: string;
};

export function buildScreenerQuery(filters: ScreenerFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, value: unknown) => {
    params.push(value);
    where.push(clause.replace('?', `$${params.length}`));
  };

  if (filters.minPrice !== undefined) add('price >= ?', filters.minPrice);
  if (filters.maxPrice !== undefined) add('price <= ?', filters.maxPrice);
  if (filters.minDiscount !== undefined) add('discount_percent >= ?', filters.minDiscount);
  if (filters.category) add('category = ?', filters.category);
  if (filters.chain) add('chain = ?', filters.chain);

  return {
    sql: `select * from screener_rows${where.length ? ` where ${where.join(' and ')}` : ''} order by discount_percent desc`,
    params,
  };
}

export async function runScreenerQuery<T>(filters: ScreenerFilters, dbQuery: (sql: string, params: unknown[]) => Promise<T[]>) {
  const query = buildScreenerQuery(filters);
  return dbQuery(query.sql, query.params);
}
