import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spend insights | GroceryView',
  description: 'Account-bound monthly grocery spend, category breakdown, and MoM/YoY comparison from purchase_history.'
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SpendPageProps = Readonly<{ params: Promise<{ country: string }> }>;
type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};
type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};
type PurchaseHistorySpendRow = {
  month: string;
  category: string;
  spend: number;
};
type SpendLoadResult = {
  rows: PurchaseHistorySpendRow[];
  blocker?: string;
};

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase() || 'se';
}

function monthDate(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return 'n/a';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function percentChange(current: number | undefined, previous: number | undefined) {
  if (!current || !previous || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function titleCaseSegment(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function numberFromRow(value: unknown) {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeSpendRows(rows: unknown[]): PurchaseHistorySpendRow[] {
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const candidate = row as Record<string, unknown>;
    const month = typeof candidate.month === 'string' ? candidate.month.slice(0, 7) : '';
    const category = typeof candidate.category === 'string' && candidate.category.trim() ? candidate.category.trim() : 'Uncategorised';
    const spend = numberFromRow(candidate.spend);
    if (!/^\d{4}-\d{2}$/.test(month) || spend <= 0) return [];
    return [{ month, category, spend: Math.round(spend * 100) / 100 }];
  });
}

async function loadPurchaseHistorySpend(country: string): Promise<SpendLoadResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return { rows: [], blocker: 'purchase_history_database_unconfigured' };

  let pool: PgPoolLike | null = null;
  try {
    const pg = await importPgModule();
    pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    const result = await pool.query(
      `select to_char(date_trunc('month', purchased_at), 'YYYY-MM') as month,
              coalesce(nullif(category, ''), 'Uncategorised') as category,
              sum(total_amount)::float as spend
         from purchase_history
        where lower(coalesce(country_code, country, 'se')) = lower($1)
        group by 1, 2
        order by 1 asc, 2 asc`,
      [normalizeCountry(country)]
    );
    return { rows: normalizeSpendRows(result.rows) };
  } catch (error) {
    return { rows: [], blocker: error instanceof Error ? `purchase_history_query_failed:${error.message}` : 'purchase_history_query_failed' };
  } finally {
    if (pool) await pool.end();
  }
}

function monthlyTotals(rows: readonly PurchaseHistorySpendRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.month, Math.round(((totals.get(row.month) ?? 0) + row.spend) * 100) / 100);
  return [...totals.entries()]
    .map(([month, spend]) => ({ month, spend }))
    .sort((left, right) => left.month.localeCompare(right.month));
}

function categoryTotalsForMonth(rows: readonly PurchaseHistorySpendRow[], month: string | undefined) {
  if (!month) return [];
  const totals = new Map<string, number>();
  for (const row of rows.filter((candidate) => candidate.month === month)) {
    totals.set(row.category, Math.round(((totals.get(row.category) ?? 0) + row.spend) * 100) / 100);
  }
  return [...totals.entries()]
    .map(([category, spend]) => ({ category, spend }))
    .sort((left, right) => right.spend - left.spend || left.category.localeCompare(right.category, 'sv'));
}

function sameMonthLastYear(month: string) {
  const date = monthDate(month);
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString().slice(0, 7);
}

export default async function SpendInsightsPage({ params }: SpendPageProps) {
  const { country } = await params;
  const marketName = titleCaseSegment(country || 'se');
  const result = await loadPurchaseHistorySpend(country || 'se');
  const months = monthlyTotals(result.rows);
  const latest = months.at(-1);
  const previous = months.at(-2);
  const yoyMonth = latest ? months.find((month) => month.month === sameMonthLastYear(latest.month)) : undefined;
  const latestCategories = categoryTotalsForMonth(result.rows, latest?.month);
  const maxSpend = Math.max(...months.map((month) => month.spend), 1);
  const latestSpend = latest?.spend ?? 0;
  const momChange = percentChange(latest?.spend, previous?.spend);
  const yoyChange = percentChange(latest?.spend, yoyMonth?.spend);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <a className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700" href="/">GroceryView</a>
        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-700">{marketName} account spend insights</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Monthly grocery spend from purchase_history</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
            The dashboard reads account-bound purchase_history rows only, then aggregates monthly spend, category mix, and month-over-month/year-over-year changes without estimating missing receipt rows.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Latest month</p>
            <p className="mt-2 text-3xl font-black">{latest?.month ?? 'No data'}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">{formatSek(latestSpend)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">MoM</p>
            <p className="mt-2 text-3xl font-black">{formatPercent(momChange)}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">versus {previous?.month ?? 'previous month missing'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">YoY</p>
            <p className="mt-2 text-3xl font-black">{formatPercent(yoyChange)}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">versus {yoyMonth?.month ?? 'same month last year missing'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Categories</p>
            <p className="mt-2 text-3xl font-black">{latestCategories.length}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">in latest purchase_history month</p>
          </div>
        </div>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-label="Monthly spend chart">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">Monthly spend chart</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Purchase history totals</h2>
            </div>
            <p className="text-sm font-semibold text-slate-600">{months.length} months from purchase_history</p>
          </div>
          {months.length > 0 ? (
            <div className="mt-6 space-y-3">
              {months.map((month) => (
                <div className="grid gap-2 sm:grid-cols-[7rem_1fr_7rem] sm:items-center" key={month.month}>
                  <p className="text-sm font-black text-slate-700">{month.month}</p>
                  <div className="h-6 rounded-full bg-slate-100" aria-label={`${month.month} ${formatSek(month.spend)}`}>
                    <div className="h-6 rounded-full bg-violet-700" style={{ width: `${Math.max(6, (month.spend / maxSpend) * 100)}%` }} />
                  </div>
                  <p className="text-sm font-black text-slate-950 sm:text-right">{formatSek(month.spend)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              No monthly spend chart is rendered because {result.blocker ?? 'purchase_history returned no rows'}.
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-label="Category breakdown">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">Category breakdown</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{latest?.month ?? 'Latest month'} category mix</h2>
            {latestCategories.length > 0 ? (
              <div className="mt-5 space-y-3">
                {latestCategories.map((category) => (
                  <div className="rounded-2xl bg-slate-50 p-4" key={category.category}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-950">{category.category}</p>
                      <p className="font-black text-violet-900">{formatSek(category.spend)}</p>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-white">
                      <div className="h-3 rounded-full bg-violet-500" style={{ width: `${Math.max(4, latestSpend > 0 ? (category.spend / latestSpend) * 100 : 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">No category rows are available for the latest month.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6" aria-label="Spend comparison guardrails">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">MoM / YoY comparison</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Only observed purchase_history months are compared</h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-950">
              <li className="rounded-2xl bg-white p-4">MoM compares the latest month with the immediately previous observed month.</li>
              <li className="rounded-2xl bg-white p-4">YoY compares the latest month with the same YYYY-MM one year earlier when present.</li>
              <li className="rounded-2xl bg-white p-4">Missing purchase_history months stay labelled as n/a; the page does not forecast, interpolate, or fabricate spend.</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
