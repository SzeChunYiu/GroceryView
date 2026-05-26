export type ScreenerChain = 'ica' | 'willys' | 'coop' | 'hemkop' | 'lidl' | 'city-gross' | string;

export type ScreenerProductRow = {
  id: string;
  name: string;
  category: string;
  chain: ScreenerChain;
  price: number;
  regularPrice: number;
  discountPercent: number;
};

export type ScreenerFilters = {
  minPrice?: number;
  maxPrice?: number;
  minDiscountPercent?: number;
  category?: string;
  chain?: ScreenerChain;
};

export type ScreenerQueryPlan = {
  where: string[];
  params: Record<string, number | string>;
  filters: Required<Pick<ScreenerFilters, never>> & ScreenerFilters;
};

export type ScreenerDbQuery = (plan: ScreenerQueryPlan) => Promise<ScreenerProductRow[]>;

export function buildScreenerQuery(filters: ScreenerFilters = {}): ScreenerQueryPlan {
  const where: string[] = [];
  const params: Record<string, number | string> = {};

  if (typeof filters.minPrice === 'number') {
    where.push('price >= :minPrice');
    params.minPrice = filters.minPrice;
  }
  if (typeof filters.maxPrice === 'number') {
    where.push('price <= :maxPrice');
    params.maxPrice = filters.maxPrice;
  }
  if (typeof filters.minDiscountPercent === 'number') {
    where.push('discount_percent >= :minDiscountPercent');
    params.minDiscountPercent = filters.minDiscountPercent;
  }
  if (filters.category) {
    where.push('category = :category');
    params.category = filters.category;
  }
  if (filters.chain) {
    where.push('chain = :chain');
    params.chain = filters.chain;
  }

  return { where, params, filters };
}

export function applyScreenerFilters(rows: readonly ScreenerProductRow[], filters: ScreenerFilters = {}): ScreenerProductRow[] {
  return rows.filter((row) => {
    if (typeof filters.minPrice === 'number' && row.price < filters.minPrice) return false;
    if (typeof filters.maxPrice === 'number' && row.price > filters.maxPrice) return false;
    if (typeof filters.minDiscountPercent === 'number' && row.discountPercent < filters.minDiscountPercent) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.chain && row.chain !== filters.chain) return false;
    return true;
  });
}

export async function runScreenerQuery(filters: ScreenerFilters, query: ScreenerDbQuery): Promise<ScreenerProductRow[]> {
  return query(buildScreenerQuery(filters));
}
