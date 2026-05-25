export type TrendingItemsQuery = {
  sql: string;
  values: [since: string, until: string, limit: number];
};

export type TrendingItemRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  price_check_count: string | number;
  list_add_count: string | number;
  event_count: string | number;
  latest_event_at: string | Date;
};

export type TrendingItem = {
  eventCount: number;
  latestEventAt: string;
  listAddCount: number;
  priceCheckCount: number;
  productId: string;
  productName: string;
  productSlug: string;
  rank: number;
};

export type TrendingItemsReport = {
  items: TrendingItem[];
  limit: number;
  sortedBy: 'event_count_desc';
  windowDays: 7;
  windowEnd: string;
  windowStart: string;
};

export type TrendingItemsQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function buildTrendingItemsQuery(options: { limit: number; since: string; until: string }): TrendingItemsQuery {
  return {
    sql: `select products.id::text as product_id,
                 products.slug as product_slug,
                 products.canonical_name as product_name,
                 count(*) filter (where analytics_events.event_name = 'price_check') as price_check_count,
                 count(*) filter (where analytics_events.event_name = 'list_add') as list_add_count,
                 count(*) as event_count,
                 max(analytics_events.occurred_at) as latest_event_at
            from analytics_events
            join products on products.id = analytics_events.product_id
           where analytics_events.event_name in ('price_check', 'list_add')
             and analytics_events.occurred_at >= $1::timestamptz
             and analytics_events.occurred_at <= $2::timestamptz
           group by products.id, products.slug, products.canonical_name
           order by event_count desc, latest_event_at desc, products.canonical_name asc
           limit $3`,
    values: [options.since, options.until, options.limit]
  };
}

export function mapTrendingItemRow(row: TrendingItemRow, index: number): TrendingItem {
  return {
    eventCount: Number(row.event_count),
    latestEventAt: iso(row.latest_event_at),
    listAddCount: Number(row.list_add_count),
    priceCheckCount: Number(row.price_check_count),
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    rank: index + 1
  };
}

export async function queryTrendingItemsReport(
  executor: TrendingItemsQueryExecutor,
  options: { limit?: number; now?: string } = {}
): Promise<TrendingItemsReport> {
  const windowEnd = options.now ?? new Date().toISOString();
  const windowStart = new Date(Date.parse(windowEnd) - 7 * 24 * 60 * 60 * 1000).toISOString();
  const limit = Math.max(1, Math.min(options.limit ?? 10, 50));
  const query = buildTrendingItemsQuery({ since: windowStart, until: windowEnd, limit });
  const rows = await executor.query<TrendingItemRow>(query.sql, query.values);

  return {
    items: rows.map(mapTrendingItemRow),
    limit,
    sortedBy: 'event_count_desc',
    windowDays: 7,
    windowEnd,
    windowStart
  };
}
