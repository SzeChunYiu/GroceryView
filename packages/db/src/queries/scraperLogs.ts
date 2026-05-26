export type ScraperHealthRow = {
  retailer: string;
  lastRunAt: string | null;
  successRate: number;
  itemCount: number;
  runCount: number;
  failedRunCount: number;
  stale: boolean;
};

export const SCRAPER_HEALTH_STALE_HOURS = 24;

export const scraperHealthQuery = `
  select
    source_name as retailer,
    max(finished_at) as last_run_at,
    avg(case when status in ('succeeded', 'partial') then 1.0 else 0.0 end) as success_rate,
    coalesce(sum((provenance->>'acceptedCount')::int), 0) as item_count,
    count(*) as run_count,
    count(*) filter (where status = 'failed') as failed_run_count
  from source_runs
  where started_at >= now() - interval '14 days'
  group by source_name
  order by source_name;
`;

export function mapScraperHealthRows(rows: Array<Record<string, unknown>>, now = new Date()): ScraperHealthRow[] {
  const nowMs = now.getTime();
  return rows.map((row) => {
    const lastRunAt = typeof row.last_run_at === 'string' ? row.last_run_at : row.last_run_at instanceof Date ? row.last_run_at.toISOString() : null;
    const lastRunMs = lastRunAt ? Date.parse(lastRunAt) : Number.NaN;
    return {
      retailer: String(row.retailer ?? 'unknown-retailer'),
      lastRunAt,
      successRate: Number(row.success_rate ?? 0),
      itemCount: Number(row.item_count ?? 0),
      runCount: Number(row.run_count ?? 0),
      failedRunCount: Number(row.failed_run_count ?? 0),
      stale: !Number.isFinite(lastRunMs) || nowMs - lastRunMs > SCRAPER_HEALTH_STALE_HOURS * 60 * 60 * 1000
    };
  });
}
