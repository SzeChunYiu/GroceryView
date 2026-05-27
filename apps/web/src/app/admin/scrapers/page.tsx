import Link from 'next/link';
import { mapScraperHealthRows, scraperHealthQuery, type ScraperHealthRow } from '@groceryview/db';
import { Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PgPoolLike = {
  query(text: string): Promise<{ rows: Array<Record<string, unknown>> }>;
  end(): Promise<void>;
};

async function scraperRowsFromDatabase(): Promise<{ rows: ScraperHealthRow[]; blockedReason: string | null }> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return { rows: [], blockedReason: 'DATABASE_URL is not configured, so scraper health fails closed instead of showing sample data.' };
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as { Pool?: new (config: { connectionString: string; max: number }) => PgPoolLike };
  if (!pgModule.Pool) return { rows: [], blockedReason: 'pg Pool is unavailable.' };
  const pool = new pgModule.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    return { rows: mapScraperHealthRows((await pool.query(scraperHealthQuery)).rows), blockedReason: null };
  } catch (error) {
    return { rows: [], blockedReason: error instanceof Error ? error.message : 'Unable to read source_runs.' };
  } finally {
    await pool.end();
  }
}

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/scrapers',
    title: 'Scraper health | GroceryView Admin',
    description: 'Admin last-run, success-rate, and item-count health for retailer scraper sources.',
    noIndex: true
  });
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, style: 'percent' }).format(value);
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never';
}

export default async function ScraperHealthPage() {
  const { rows: scraperRows, blockedReason } = await scraperRowsFromDatabase();
  const staleCount = scraperRows.filter((row) => row.stale).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link className="text-sm font-black text-emerald-800" href="/admin">← Admin dashboard</Link>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Scraper health</Eyebrow>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Retailer scraper run status</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Last-run time, success/failure rate, and accepted item counts are sourced from source_runs evidence. Rows older than 24 hours are flagged for operator follow-up.
          </p>
        </div>
        <StatusBadge tone={blockedReason || staleCount > 0 ? 'warning' : 'success'}>{blockedReason ? 'DB evidence required' : `${staleCount} stale scraper${staleCount === 1 ? '' : 's'}`}</StatusBadge>
      </div>

      <Card className="mt-6">
        {blockedReason ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
            {blockedReason}
          </div>
        ) : null}
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Retailer scraper</th>
                <th className="px-4 py-3">Last run</th>
                <th className="px-4 py-3">Success rate</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Runs</th>
                <th className="px-4 py-3">Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {scraperRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm font-bold text-slate-600" colSpan={6}>No source_runs scraper evidence is available yet.</td>
                </tr>
              ) : null}
              {scraperRows.map((row) => (
                <tr key={row.retailer}>
                  <td className="px-4 py-4 font-black text-slate-950">{row.retailer}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{formatDate(row.lastRunAt)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{formatPercent(row.successRate)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{row.itemCount.toLocaleString('sv-SE')}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{row.runCount} total · {row.failedRunCount} failed</td>
                  <td className="px-4 py-4"><StatusBadge tone={row.stale ? 'warning' : 'success'}>{row.stale ? 'No run in 24h' : 'Fresh'}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
