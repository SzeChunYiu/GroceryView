import Link from 'next/link';
import { ArrowRight, CalendarClock, RefreshCw, ShieldAlert } from 'lucide-react';
import { ConfidenceBadge } from '@/components/confidence-badge';

const methodologyDate = '2026-03-31';

const indexConstituents = [
  { label: 'Staples basket', value: 24, weight: 0.27, tone: 'high' as const, source: 'Verified shelf + loyalty override removed' },
  { label: 'Fresh produce', value: 16, weight: 0.23, tone: 'high' as const, source: 'Verified shelf + receipts where recency < 3 days' },
  { label: 'Dairy and bread', value: 11, weight: 0.18, tone: 'medium' as const, source: 'Store-price samples and catalog history' },
  { label: 'Meat and fish', value: 9, weight: 0.12, tone: 'medium' as const, source: 'Verified public shelf + validated receipt rows' },
  { label: 'Pantry goods', value: 7, weight: 0.09, tone: 'medium' as const, source: 'OpenPrices scrape snapshots + periodic audits' },
  { label: 'Household extras', value: 6, weight: 0.08, tone: 'low' as const, source: 'Sparse coverage; model-imputed normalization only' },
  { label: 'Other', value: 7, weight: 0.03, tone: 'low' as const, source: 'Unmapped rows with confidence below threshold' },
];

const rebalances = [
  { label: 'Quarterly composition review', cadence: 'Every quarter' },
  { label: 'Constituent eligibility', cadence: 'Monthly quality refresh' },
  { label: 'Coverage audit and index freeze windows', cadence: 'Weekly' },
  { label: 'Fallback methodology change control', cadence: 'As needed with changelog notice' },
];

const confidenceChecks = [
  {
    label: 'Verified price floor', level: 'high' as const,
    body: 'Only verified shelf rows can alter index output. Estimated and low-confidence rows are retained for diagnostics only.',
  },
  {
    label: 'Coverage guardrail', level: 'medium' as const,
    body: 'A category contributes only if it has at least 5 active stores and 14 days of fresh observations.',
  },
  {
    label: 'Rebalance transparency', level: 'high' as const,
    body: 'Any reweighting is published with a new effective date and prior methodology snapshot.',
  },
  {
    label: 'Outlier management', level: 'low' as const,
    body: 'Extreme price points are clipped at the 5th/95th percentile unless manually reviewed.',
  },
];

export default function IndexMethodologyPage() {
  const totalWeight = indexConstituents.reduce((sum, row) => sum + row.weight, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_auto]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-market-mint">Index disclosure</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-market-ink">Stockholm Grocery Index methodology</h1>
          <p className="mt-4 max-w-2xl leading-7 text-market-ink/70">
            How the fixed-basket index is calculated, rebalanced, and constrained. This page mirrors the transparency style used for
            external benchmark disclosures while using GroceryView-specific confidence and coverage gates.
          </p>
        </div>
        <Link
          className="inline-flex h-fit items-center gap-2 rounded-lg border border-market-ink/15 bg-white px-4 py-3 text-sm font-bold text-market-ink transition hover:border-market-mint"
          href="/market"
        >
          View live index surface
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="grid gap-4 rounded-xl border border-market-ink/15 bg-white p-6 shadow-sm md:grid-cols-[1fr_1fr]">
        <article>
          <p className="text-sm font-semibold uppercase text-market-ink/55">Base date</p>
          <h2 className="mt-2 text-2xl font-black text-market-ink">{methodologyDate}</h2>
          <p className="mt-3 text-sm text-market-ink/70">
            The current methodology snapshot was finalized on {methodologyDate}. Re-weights and inclusion filters only take effect at
            the scheduled rebalancing cadence below.
          </p>
        </article>
        <article>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase text-market-ink/55">Index confidence</p>
            <CalendarClock className="h-5 w-5 text-market-mint" aria-hidden="true" />
          </div>
          <p className="mt-2 text-sm text-market-ink/70">
            Effective at publish-time weights are normalized to 100% and bounded by category confidence and coverage checks.
          </p>
          <p className="mt-3 text-lg font-semibold text-market-ink">Current normalization target: {(totalWeight * 100).toFixed(0)}%</p>
        </article>
      </section>

      <section className="rounded-xl border border-market-ink/15 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-market-ink">Constituent basket and weights</h2>
        <p className="mt-2 text-sm text-market-ink/70">
          Basket rows are grouped by broad category and are updated before each rebalancing window.
        </p>
        <div className="mt-5 grid gap-4">
          {indexConstituents.map((row) => (
            <article className="space-y-2" key={row.label}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-market-ink">{row.label}</p>
                  <p className="text-xs text-market-ink/55">{row.source}</p>
                </div>
                <ConfidenceBadge level={row.tone} label={`${row.value}%`} sampleSize={indexConstituents.length} />
              </div>
              <div className="h-2 rounded-full bg-market-oat">
                <div className="h-2 rounded-full bg-market-mint" style={{ width: `${(row.weight / totalWeight) * 100}%` }} />
              </div>
              <p className="text-sm text-market-ink/70">Weight: {(row.weight * 100).toFixed(1)}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-market-ink/15 bg-white p-6 shadow-sm lg:grid-cols-2">
        <article>
          <h2 className="text-xl font-bold text-market-ink">Rebalancing and governance</h2>
          <p className="mt-2 text-sm text-market-ink/70">Rules that keep the index predictable across volatile price cycles.</p>
          <ul className="mt-4 space-y-3 text-sm text-market-ink/70">
            {rebalances.map((row) => (
              <li className="flex gap-3" key={row.label}>
                <RefreshCw className="mt-0.5 h-4 w-4 text-market-mint" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-market-ink">{row.label}</p>
                  <p>{row.cadence}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h2 className="text-xl font-bold text-market-ink">Coverage and confidence filters</h2>
          <p className="mt-2 text-sm text-market-ink/70">Components below minimum confidence are excluded from direct impact.</p>
          <ul className="mt-4 space-y-3">
            {confidenceChecks.map((row) => (
              <li className="rounded-lg border border-market-ink/10 bg-market-paper p-3" key={row.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-market-ink">{row.label}</p>
                  <ConfidenceBadge level={row.level} label={row.level === 'high' ? 'high' : row.level === 'medium' ? 'medium' : 'low'} />
                </div>
                <p className="mt-2 text-sm text-market-ink/70">{row.body}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-market-ink/15 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-market-ink">How this index can be used</h2>
        <p className="mt-2 text-sm text-market-ink/70">
          Use this methodology before making basket allocation, promotion timing, or store strategy decisions. The methodology is not a
          price guarantee.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-lg border border-market-mint/30 bg-market-paper/50 p-4">
            <p className="font-semibold text-market-ink">Policy intent</p>
            <p className="mt-1 text-sm text-market-ink/75">
              Benchmark a single fixed basket against historical movement and avoid over-trading from one-off promotions.
            </p>
          </article>
          <article className="rounded-lg border border-market-mint/30 bg-market-paper/50 p-4">
            <p className="font-semibold text-market-ink">Risk note</p>
            <p className="mt-1 flex items-start gap-2 text-sm text-market-ink/75">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-market-tomato" aria-hidden="true" />
              Estimated, low-confidence prices can influence diagnostics but never trigger official index moves.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
