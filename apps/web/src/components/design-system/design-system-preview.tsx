'use client';

import { useState } from 'react';
import {
  AdSlot,
  ChartShell,
  DealCard,
  EmptyState,
  EvidenceStrip,
  FilterRail,
  KpiCard,
  PageQuestionHeader,
  ProductCard,
  SortControl,
  dsPrimaryButton,
  dsSecondaryButton
} from '@/components/design-system';
import {
  designSystemChartTableFallback,
  designSystemDealFixture,
  designSystemFilterOptions,
  designSystemProductFixture,
  designSystemSortOptions
} from '@/lib/design-system-fixtures';

function DesignSystemInteractivePreview() {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('best_deal');

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <FilterRail onChange={setFilter} options={designSystemFilterOptions} value={filter} />
      <SortControl onChange={setSort} options={designSystemSortOptions} value={sort} />
    </div>
  );
}

export function DesignSystemPreviewSection() {
  return (
    <div className="flex flex-col gap-6">
      <PageQuestionHeader
        actions={
          <>
            <a className={dsPrimaryButton} href="/search">
              Search products
            </a>
            <a className={dsSecondaryButton} href="/data-sources">
              View sources
            </a>
          </>
        }
        evidence={
          <>
            <span className="rounded-full border border-[color:var(--gv-border)] bg-[var(--gv-primary-soft)] px-3 py-1 text-[length:var(--gv-text-micro)] font-bold text-[color:var(--gv-primary)]">
              24 verified observations
            </span>
            <span className="rounded-full border border-[color:var(--gv-border)] bg-[var(--gv-surface-muted)] px-3 py-1 text-[length:var(--gv-text-micro)] font-bold text-[color:var(--gv-ink-soft)]">
              Updated 12 Apr 2026
            </span>
          </>
        }
        eyebrow="Design system"
        question="Which verified grocery prices should we surface first?"
        subtitle="Token-backed cards, evidence strips, and calm Nordic dashboard surfaces for search, market, and product routes."
        title="GroceryView design system preview"
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="KPI cards">
        <KpiCard delta="−4.8% vs last week" href="/market" label="Median basket change" meaning="Staple rows are modestly cheaper than last week in verified snapshots." value="−2.1%" />
        <KpiCard delta="+18 verified rows" href="/data-sources" label="Observation coverage" meaning="More chains contributed observed prices in the latest connector run." value="126" />
        <KpiCard delta="High confidence" href="/confidence" label="Deal quality" meaning="Most highlighted deals remain below historic medians with fresh evidence." value="82 / 100" />
      </section>

      <DesignSystemInteractivePreview />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" aria-label="Product and deal cards">
        <ProductCard packageLabel="1 L" product={designSystemProductFixture} unitPriceLabel="15.95 kr/L" />
        <DealCard deal={designSystemDealFixture} />
      </section>

      <ChartShell
        actions={<button className={dsSecondaryButton} type="button">Export table</button>}
        chart={
          <div className="flex h-40 items-end gap-2 px-2 pb-2">
            {[17.5, 17.1, 16.95, 15.95].map((value, index) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={value}>
                <div className="w-full rounded-t-md bg-[var(--gv-primary)]" style={{ height: `${(value / 18) * 100}%` }} />
                <span className="text-[length:var(--gv-text-micro)] text-[color:var(--gv-muted)]">M{index + 1}</span>
              </div>
            ))}
          </div>
        }
        evidence={designSystemProductFixture}
        legend={
          <>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-2 w-6 rounded bg-[var(--gv-primary)]" />
              Observed median
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-2 w-6 rounded border border-dashed border-[color:var(--gv-muted)]" />
              Historic comparison
            </span>
          </>
        }
        question="Price trend"
        summary="Preview chart shell with legend, evidence, and accessible table fallback."
        tableFallback={
          <table className="min-w-full text-left text-[length:var(--gv-text-small)]">
            <thead className="bg-[var(--gv-surface-muted)] text-[color:var(--gv-ink-soft)]">
              <tr>
                {designSystemChartTableFallback.headers.map((header) => (
                  <th className="px-3 py-2 font-bold" key={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designSystemChartTableFallback.rows.map((row) => (
                <tr className="border-t border-[color:var(--gv-border)]" key={row.join('-')}>
                  {row.map((cell) => (
                    <td className="px-3 py-2 text-[color:var(--gv-ink-soft)]" key={cell}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        }
        title="Observed milk price history"
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]" aria-label="Evidence and ad slot">
        <div className="rounded-[length:var(--gv-radius-card)] border border-[color:var(--gv-border)] bg-[var(--gv-surface)] p-4">
          <p className="text-[length:var(--gv-text-micro)] font-bold uppercase tracking-[0.16em] text-[color:var(--gv-muted)]">Evidence strip</p>
          <div className="mt-3">
            <EvidenceStrip evidence={designSystemProductFixture} />
          </div>
        </div>
        <AdSlot minHeight={160} />
      </section>

      <EmptyState
        action={{ href: '/search', label: 'Search verified products' }}
        nextSteps="Try a broader category, remove active filters, or review source coverage for this market."
        reason="No verified observations matched the current filter combination in the latest connector snapshot."
        secondaryAction={{ href: '/coverage', label: 'Review coverage' }}
        title="Nothing verified to show yet"
      />
    </div>
  );
}
