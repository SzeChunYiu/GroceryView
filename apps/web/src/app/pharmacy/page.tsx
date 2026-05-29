import Link from 'next/link';
import type { ReactNode } from 'react';
import { BadgeCheck, ExternalLink, Pill, Sparkles, Tablets } from 'lucide-react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ChartShell, ChartTableFallback, DistributionBand, Sparkline } from '@/components/mvp/visual-intelligence';
import { PharmacyTargetAlertControls, type PharmacyTargetAlertProduct } from '@/components/pharmacy-target-alerts';
import { TerminalQuoteTable, TerminalTickerCard, type TerminalQuoteRow } from '@/components/terminal-surface';
import {
  apohemEanMatches,
  apohemProducts,
  apohemSource,
  type ApohemIngestedProduct,
  type PharmacyProductCategory
} from '@/lib/ingested/apohem';
import { buildPriceHistorySparklinePath } from '@/lib/price-events';
import { categoryLabels as openPriceCategoryLabels, pricedProducts } from '@/lib/openprices-products';
import { formatSek, multiVerticalDomainFoundation, pharmacyOtcEvidenceBoard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export const dynamic = 'force-static';

export function generateMetadata() {
  return routeMetadata('/pharmacy');
}

const pharmacyCategoryLabels: Record<PharmacyProductCategory, string> = {
  otc: 'OTC',
  supplement: 'Supplements',
  beauty: 'Beauty'
};

const categoryIcons: Record<PharmacyProductCategory, ReactNode> = {
  otc: <Pill size={18} />,
  supplement: <Tablets size={18} />,
  beauty: <Sparkles size={18} />
};

const chainLabels: Record<ApohemIngestedProduct['chain'], string> = {
  apohem: 'Apohem',
  'apotek-hjartat': 'Apotek Hjärtat'
};

const categories: PharmacyProductCategory[] = ['otc', 'supplement', 'beauty'];
const sourceHostnames = apohemSource.sourceUrls.map((sourceUrl) => new URL(sourceUrl).hostname);
const uniqueSourceHostnames = [...new Set(sourceHostnames)];
const pricedProductBySlug = new Map(pricedProducts.map((product) => [product.slug, product]));

function countBy<T extends string>(rows: readonly ApohemIngestedProduct[], key: (row: ApohemIngestedProduct) => T) {
  return rows.reduce<Record<T, number>>((counts, row) => {
    counts[key(row)] = (counts[key(row)] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

const countsByCategory = countBy(apohemProducts, (product) => product.category);
const countsByChain = countBy(apohemProducts, (product) => product.chain);

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function categoryRows(category: PharmacyProductCategory) {
  return apohemProducts.filter((product) => product.category === category);
}

function sourceLabel(sourceUrl: string) {
  const url = new URL(sourceUrl);
  return `${url.hostname}${url.pathname}`;
}

function chainCoverage(rows: readonly ApohemIngestedProduct[]) {
  return [...new Set(rows.map((row) => row.chain))];
}

function cheapestPharmacyComparisons() {
  const byEan = new Map<string, ApohemIngestedProduct[]>();
  for (const product of apohemProducts) {
    if (!product.isOtc || product.category !== 'otc' || !Number.isFinite(product.price) || product.price <= 0) continue;
    byEan.set(product.ean, [...(byEan.get(product.ean) ?? []), product]);
  }

  return [...byEan.entries()]
    .map(([ean, rows]) => {
      const uniqueChains = chainCoverage(rows);
      if (uniqueChains.length < 2) return null;
      const sortedRows = [...rows].sort((left, right) => left.price - right.price || chainLabels[left.chain].localeCompare(chainLabels[right.chain], 'sv'));
      const cheapest = sortedRows[0];
      const highest = sortedRows.at(-1);
      if (!cheapest || !highest) return null;
      const spread = highest.price - cheapest.price;
      return {
        ean,
        name: cheapest.name,
        brand: cheapest.brand || cheapest.code,
        rows: sortedRows,
        cheapest,
        highest,
        spread,
        spreadPct: cheapest.price > 0 ? (spread / cheapest.price) * 100 : 0
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((left, right) => right.spread - left.spread || right.spreadPct - left.spreadPct || left.name.localeCompare(right.name, 'sv'))
    .slice(0, 6);
}

const pharmacyComparisons = cheapestPharmacyComparisons();
const pharmacySafetyBoundaryItems = [
  'OTC public catalog only.',
  'No prescription medicine.',
  'No medical advice.',
  'Exact EAN comparison only.',
  'No stock claim unless source provides stock.'
];

function comparisonQuoteRows(rows: readonly ApohemIngestedProduct[], cheapestPrice: number): TerminalQuoteRow[] {
  return rows.map((row) => ({
    id: `${row.chain}-${row.ean}`,
    label: chainLabels[row.chain],
    quote: row.priceText,
    comparisonLabel: row.price === cheapestPrice ? 'Cheapest public row' : `${formatSek(row.price - cheapestPrice)} above cheapest`,
    confidence: 'high',
    freshnessLabel: `Retrieved ${formatDate(row.retrievedAt)}`,
    sourceLabel: sourceLabel(row.sourceUrl),
    href: row.productUrl
  }));
}

const pharmacyAlertProducts: PharmacyTargetAlertProduct[] = pharmacyComparisons.map((comparison) => ({
  ean: comparison.ean,
  name: comparison.name,
  chainLabel: chainLabels[comparison.cheapest.chain],
  currentPrice: comparison.cheapest.price,
  currentPriceText: comparison.cheapest.priceText,
  retrievedAt: comparison.cheapest.retrievedAt,
  sourceUrl: comparison.cheapest.sourceUrl
}));

const pharmacyOtcHistoryRows = pharmacyOtcEvidenceBoard.rows
  .map((row) => {
    const product = pricedProductBySlug.get(row.slug);
    if (!product || product.observations.length < 2) return null;
    const observations = [...product.observations]
      .filter((observation) => Number.isFinite(observation.price))
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-8);
    const path = buildPriceHistorySparklinePath(observations, 220, 64);
    if (!path) return null;
    return {
      ...row,
      category: openPriceCategoryLabels[product.category] ?? product.category,
      observations,
      path,
      latestPrice: observations.at(-1)?.price ?? row.priceMedian,
      firstPrice: observations[0]?.price ?? row.priceMedian
    };
  })
  .filter((row): row is NonNullable<typeof row> => row !== null)
  .slice(0, 4);

const pharmacyVisualRows = pharmacyComparisons.flatMap((comparison) => {
  const prices = comparison.rows.map((row) => row.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return comparison.rows.map((row) => {
    const matchingHistory = pharmacyOtcHistoryRows.find((history) => history.code === row.ean);
    const priceHistoryMiniLine = matchingHistory
      ? matchingHistory.observations.map((observation) => ({
        label: observation.date,
        value: observation.price
      }))
      : [
        { label: 'Retrieved snapshot', value: row.price },
        { label: formatDate(row.retrievedAt), value: row.price }
      ];
    return {
      product: comparison.name,
      ean: comparison.ean,
      chain: chainLabels[row.chain],
      price: row.price,
      priceLabel: row.priceText,
      retrieved: formatDate(row.retrievedAt),
      source: sourceLabel(row.sourceUrl),
      href: row.productUrl,
      min,
      max,
      priceHistoryMiniLine
    };
  });
});

function DomainFoundationSummary({ domainSlug }: Readonly<{ domainSlug: 'pharmacy' }>) {
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === domainSlug)!;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <Eyebrow>{domain.label} evidence</Eyebrow>
      <h2 className="mt-2 text-2xl font-black text-amber-950">Pharmacy OTC price comparison</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
        Pharmacy prices are currently shown from public OTC catalog rows. The page keeps safety boundaries visible and does not claim prescription coverage, stock, or a cheapest pharmacy result.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Status</p>
          <p className="mt-2 text-lg font-black text-amber-950">Public OTC catalog comparison active</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Exact EAN coverage</p>
          <p className="mt-2 text-lg font-black text-amber-950">{domain.seedItemCount} exact EAN products ready</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Claim boundary</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{domain.claimBoundary}</p>
        </div>
      </div>
    </Card>
  );
}

export default function PharmacyPage() {
  return (
    <PageShell>
      <DomainFoundationSummary domainSlug="pharmacy" />

      <header className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-market-mint">
            <BadgeCheck size={16} />
            Pharmacy catalog
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {apohemSource.rowCount} EAN-coded OTC, supplement, and beauty rows.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Apohem and Apotek Hjärtat public pages retrieved {formatDate(apohemSource.retrievedAt)}. Prescription product
            groups are excluded before the static rows are surfaced.
          </p>
        </div>

        <div className="rounded-lg border border-market-ink/10 bg-white p-5">
          <h2 className="text-lg font-black">Source tape</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <MetadataRow label="Chains" value={uniqueSourceHostnames.join(' + ')} />
            <MetadataRow label="Rows" value={apohemSource.rowCount.toLocaleString()} />
            <MetadataRow label="EAN matches" value={apohemSource.eanMatchCount.toLocaleString()} />
            <MetadataRow label="Retrieved" value={formatDate(apohemSource.retrievedAt)} />
          </dl>
        </div>
      </header>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
        {pharmacySafetyBoundaryItems.join(' ')} OTC, supplement, and beauty rows are shown as public catalog evidence only.
      </section>

      <ChartShell
        actionHref="/pharmacy"
        actionLabel="Open pharmacy surface"
        evidenceItems={[
          `${pharmacyComparisons.length} exact OTC comparisons`,
          `${apohemEanMatches.length.toLocaleString()} cross-chain EAN matches`,
          `Retrieved ${formatDate(apohemSource.retrievedAt)}`
        ]}
        hasData={pharmacyVisualRows.length > 0}
        insightTitle="Pharmacy visual command center"
        plainSummary="Safety boundary card, exact EAN comparisons, OTC price cards, source freshness, history sparklines, and target alert controls stay inside public-catalog OTC evidence."
        userQuestion="Can I compare OTC pharmacy prices safely?"
        fallback={
          <ChartTableFallback
            caption="Exact EAN comparison only pharmacy fallback"
            columns={[
              { key: 'product', label: 'Product', render: (row) => row.product },
              { key: 'ean', label: 'EAN', render: (row) => row.ean },
              { key: 'chain', label: 'Chain', render: (row) => row.chain },
              { key: 'price', label: 'Price', render: (row) => row.priceLabel },
              { key: 'retrieved', label: 'Retrieved', render: (row) => row.retrieved }
            ]}
            rows={pharmacyVisualRows}
          />
        }
      >
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">Safety boundary card</p>
            <h3 className="mt-2 text-xl font-black text-indigo-950">Exact EAN comparison only.</h3>
            <div className="mt-4 grid gap-2">
              {pharmacySafetyBoundaryItems.map((item) => (
                <p className="rounded-2xl bg-white p-3 text-sm font-black text-indigo-950 shadow-sm" key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {pharmacyVisualRows.slice(0, 4).map((row) => (
              <a className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm hover:border-emerald-700" href={row.href} key={`${row.chain}-${row.ean}-visual`}>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{row.chain} · Retrieved {row.retrieved}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{row.product}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-600">EAN {row.ean} · {row.source}</p>
                <p className="mt-3 text-3xl font-black text-emerald-800">{row.priceLabel}</p>
                <DistributionBand current={row.price} label={`${row.product} exact EAN pharmacy price range`} max={row.max} min={row.min} />
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">OTC history sparkline</p>
                  <Sparkline label={`${row.product} OTC public catalog only price history`} points={row.priceHistoryMiniLine} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </ChartShell>

      <Card className="border-indigo-200 bg-indigo-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>{pharmacyOtcEvidenceBoard.source}</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-indigo-950">OTC price evidence from public observations</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              These OpenPrices + OpenBeautyFacts rows are not a pharmacy-chain comparison. They keep OTC price evidence
              visible without adding prescription medicine, medical advice, stock, or cheapest-pharmacy claims.
            </p>
          </div>
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-indigo-950 shadow-sm">
            {pharmacyOtcEvidenceBoard.productCount} OTC candidates · {pharmacyOtcEvidenceBoard.observationCount} observations
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pharmacyOtcEvidenceBoard.rows.map((row) => (
            <Link className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm hover:border-indigo-700" data-pharmacy-otc-evidence={row.slug} href={`/products/${row.slug}`} key={row.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{row.evidence}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · EAN {row.code}</p>
              <p className="mt-3 text-2xl font-black text-indigo-950">{formatSek(row.priceMedian)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Range {formatSek(row.priceMin)} to {formatSek(row.priceMax)} · {row.observationCount} observations</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.confidence} · last {row.lastObservedAt}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-950">
          No prescription medicine. No medical advice. Not a pharmacy-chain comparison.
        </p>
      </Card>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5" aria-label="Cheapest OTC pharmacy comparison">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Exact EAN comparison</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-emerald-950">Cheapest public pharmacy rows for matched OTC products</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-emerald-950">
              Rows compare only identical EANs that appear in both Apohem and Apotek Hjärtat public source captures. Cheapest means lowest source-backed catalog price in the retrieved snapshot, not a stock or suitability recommendation.
            </p>
          </div>
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-emerald-950 shadow-sm">
            {pharmacyComparisons.length} exact OTC comparisons · {apohemEanMatches.length.toLocaleString()} cross-chain EAN matches
          </p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {pharmacyComparisons.slice(0, 3).map((comparison) => (
            <TerminalTickerCard
              confidence="high"
              deltaLabel={`${formatSek(comparison.spread)} gap to highest matched row`}
              detail={`${comparison.brand} · EAN ${comparison.ean} · ${comparison.rows.length} public rows`}
              freshnessLabel={`Retrieved ${formatDate(comparison.cheapest.retrievedAt)}`}
              href={comparison.cheapest.productUrl}
              key={comparison.ean}
              label={`Cheapest ${chainLabels[comparison.cheapest.chain]}`}
              sourceLabel={sourceLabel(comparison.cheapest.sourceUrl)}
              value={comparison.cheapest.priceText}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {pharmacyComparisons.slice(0, 4).map((comparison) => (
            <TerminalQuoteTable
              caption={`${comparison.name} exact-EAN pharmacy quotes`}
              key={comparison.ean}
              rows={comparisonQuoteRows(comparison.rows, comparison.cheapest.price)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-sky-200 bg-sky-50 p-5" aria-label="Pharmacy OTC price history and alerts">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <Eyebrow>OTC history and alerts</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-sky-950">Observed OTC history with target price alerts</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-sky-950">
              History charts use dated OpenPrices observations for OTC evidence rows. Target alerts save only a local preference against the cheapest public pharmacy row until account-backed pharmacy alert delivery is available.
            </p>
          </div>
          <PharmacyTargetAlertControls products={pharmacyAlertProducts} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {pharmacyOtcHistoryRows.map((row) => (
            <Link className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm hover:border-sky-700" href={`/products/${row.slug}`} key={row.slug}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">{row.category}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{row.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · EAN {row.code}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Latest observed</p>
                  <p className="text-xl font-black text-sky-950">{formatSek(row.latestPrice)}</p>
                </div>
              </div>
              <svg aria-label={`${row.name} observed OTC price history`} className="mt-4 h-20 w-full rounded-2xl bg-slate-50 p-3" preserveAspectRatio="none" viewBox="0 0 220 64">
                <path d={row.path} fill="none" stroke="#0369a1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
                <p className="rounded-2xl bg-slate-50 p-3">First {formatSek(row.firstPrice)}</p>
                <p className="rounded-2xl bg-slate-50 p-3">Range {formatSek(row.priceMin)} to {formatSek(row.priceMax)}</p>
                <p className="rounded-2xl bg-slate-50 p-3">Last {row.lastObservedAt}</p>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.confidence} · no medical advice</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <MetricTile
            key={category}
            icon={categoryIcons[category]}
            label={pharmacyCategoryLabels[category]}
            value={String(countsByCategory[category] ?? 0)}
          />
        ))}
        <MetricTile label="Apohem" value={String(countsByChain.apohem ?? 0)} />
        <MetricTile label="Apotek Hjärtat" value={String(countsByChain['apotek-hjartat'] ?? 0)} />
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Cross-chain EAN matches</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Shared barcodes are kept as explicit match evidence across the two pharmacy sources.
            </p>
          </div>
          <span className="text-sm font-black tabular-nums text-market-mint">
            {apohemEanMatches.length.toLocaleString()} matches
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {apohemEanMatches.slice(0, 8).map((match) => (
            <div key={match.ean} className="border-b border-market-ink/10 px-4 py-3 text-sm md:border-r">
              <span className="block font-black tabular-nums">{match.ean}</span>
              <span className="mt-1 block text-market-ink/60">{match.names.join(' / ')}</span>
            </div>
          ))}
        </div>
      </section>

      {categories.map((category) => (
        <ProductSection key={category} title={pharmacyCategoryLabels[category]} products={categoryRows(category)} />
      ))}

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Retrieved sources</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {apohemSource.sourceUrls.map((sourceUrl) => (
            <a
              key={sourceUrl}
              href={sourceUrl}
              className="flex items-center justify-between gap-3 border-b border-market-ink/10 px-4 py-3 text-sm font-semibold hover:bg-market-oat/45 md:border-r"
            >
              <span className="truncate">{sourceLabel(sourceUrl)}</span>
              <ExternalLink size={16} className="shrink-0 text-market-mint" />
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ProductSection({ title, products }: { title: string; products: ApohemIngestedProduct[] }) {
  return (
    <section className="rounded-lg border border-market-ink/10 bg-white">
      <div className="grid gap-2 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
        <h2 className="text-lg font-black">{title}</h2>
        <span className="text-sm font-black tabular-nums text-market-mint">{products.length.toLocaleString()} rows</span>
      </div>
      <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
        <span>Product</span>
        <span>Chain</span>
        <span>EAN</span>
        <span>Price</span>
        <span>Source</span>
      </div>
      <ul className="divide-y divide-market-ink/5">
        {products.slice(0, 18).map((product) => (
          <li
            key={`${product.chain}-${product.ean}`}
            className="grid gap-3 px-4 py-3 text-sm hover:bg-market-oat/45 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.9fr]"
          >
            <a href={product.productUrl} className="min-w-0 font-black hover:text-market-mint">
              <span className="block truncate" title={product.name}>
                {product.name}
              </span>
              <span className="mt-1 block truncate text-xs font-semibold text-market-ink/55">
                {product.brand || product.code}
              </span>
            </a>
            <span className="font-semibold text-market-ink/70">{chainLabels[product.chain]}</span>
            <span className="font-mono text-xs text-market-ink/65">{product.ean}</span>
            <span className="font-black tabular-nums">{product.priceText}</span>
            <a href={product.sourceUrl} className="truncate text-xs font-bold text-market-mint" title={product.sourceUrl}>
              {sourceLabel(product.sourceUrl)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MetricTile({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-market-ink/10 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-market-ink/50">
        {icon ? <span className="text-market-mint">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-2 text-3xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-market-ink/10 pb-2 last:border-b-0">
      <dt className="text-market-ink/55">{label}</dt>
      <dd className="truncate font-black">{value}</dd>
    </div>
  );
}
