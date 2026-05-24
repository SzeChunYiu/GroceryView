export type ProductSearchQueryOptions = {
  limit?: number;
};

export type ProductSearchQuery = {
  sql: string;
  values: [query: string, limit: number];
};

export type ProductSearchRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  search_rank: string | number | null;
};

export type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  searchRank: number;
};

export type ProductSearchQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

function normalizeSearchQuery(query: string): string | null {
  const normalized = query.trim().replace(/\s+/g, ' ');
  return normalized.length >= 2 ? normalized : null;
}

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
}

export function buildProductSearchQuery(query: string, options: ProductSearchQueryOptions = {}): ProductSearchQuery | null {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return null;

  const searchDocument = "coalesce(products.canonical_name, '') || ' ' || coalesce(products.name_sv, '') || ' ' || coalesce(products.name_en, '') || ' ' || coalesce(products.brand, '')";
  const normalizedSearchDocument = `lower(unaccent(${searchDocument}))`;
  const searchVector = `to_tsvector('simple', unaccent(${searchDocument}))`;
  const fuzzyRank = `similarity(${normalizedSearchDocument}, query.fuzzy_query)`;

  return {
    sql: `with query as (
            select websearch_to_tsquery('simple', unaccent($1)) as search_query,
                   lower(unaccent($1)) as fuzzy_query
          )
          select products.id::text as id,
                 products.slug,
                 products.canonical_name as name,
                 products.brand,
                 products.image_url,
                 greatest(ts_rank_cd(${searchVector}, query.search_query), ${fuzzyRank}) as search_rank
            from products
            cross join query
           where products.domain = 'grocery'
             and (
               ${searchVector} @@ query.search_query
               or ${normalizedSearchDocument} like '%' || query.fuzzy_query || '%'
               or ${fuzzyRank} >= 0.2
             )
           order by search_rank desc, ${fuzzyRank} desc, products.canonical_name asc
           limit $2`,
    values: [normalizedQuery, clampLimit(options.limit)]
  };
}

export function mapProductSearchRow(row: ProductSearchRow): ProductSearchResult {
  const rank = Number(row.search_rank ?? 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    imageUrl: row.image_url,
    searchRank: Number.isFinite(rank) ? rank : 0
  };
}

export async function searchProductsByText(
  executor: ProductSearchQueryExecutor,
  query: string,
  options: ProductSearchQueryOptions = {}
): Promise<ProductSearchResult[]> {
  const searchQuery = buildProductSearchQuery(query, options);
  if (!searchQuery) return [];

  const rows = await executor.query<ProductSearchRow>(searchQuery.sql, searchQuery.values);
  return rows.map(mapProductSearchRow);
}
