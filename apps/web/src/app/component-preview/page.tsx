import Link from 'next/link';
import { DesignSystemPreviewSection } from '@/components/design-system/design-system-preview';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceFreshnessStatusBadge, SourceHealthDashboardTable, StatusBadge } from '@/components/data-ui';
import { PriceChartTerminal } from '@/components/price-chart-terminal';
import { BestTimeForecastPanel, PriceIntelligenceCard } from '@/components/price-intelligence-card';
import { StoreComparisonTable } from '@/components/StoreComparisonTable';
import {
  TerminalDealVerdict,
  TerminalMarketSwitcher,
  TerminalMethodologyLinks,
  TerminalQuoteTable,
  TerminalSourceCitations,
  TerminalStatePanel,
  TerminalTickerCard
} from '@/components/terminal-surface';
import {
  terminalDealVerdictFixture,
  terminalMarketSwitcherFixture,
  terminalMethodologyLinksFixture,
  terminalQuoteTableFixture,
  terminalSourceCitationsFixture,
  terminalStateFixtures,
  terminalTickerCardFixtures
} from '@/components/terminal-surface.fixtures';
import {
  componentPreviewChart,
  componentPreviewMarkets,
  componentPreviewPriceCards,
  componentPreviewStoreItems
} from '@/lib/component-preview-fixtures';
import { routeMetadata } from '@/lib/seo';
import { sourceHealthDashboardRows } from '@/lib/source-health';

export function generateMetadata() {
  return routeMetadata({
    path: '/component-preview',
    title: 'Component preview harness | GroceryView',
    description: 'Internal preview harness for GroceryView grocery UI components, data states, market coverage, charts, tables, and badges.',
    noIndex: true
  });
}

export const dynamic = 'force-static';

export default function ComponentPreviewPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Component preview</Eyebrow>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Grocery UI harness</h1>
              <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-700">
                Internal route for reviewing source-backed cards, charts, tables, badges, market switchers, and failure states across Swedish, Norwegian, and Icelandic grocery coverage surfaces.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">SE verified</StatusBadge>
              <StatusBadge tone="warning">NO partial</StatusBadge>
              <StatusBadge>IS empty</StatusBadge>
            </div>
          </div>
        </section>

        <DesignSystemPreviewSection />

        <section className="grid gap-3 md:grid-cols-3" aria-label="Country coverage fixtures">
          {componentPreviewMarkets.map((market) => (
            <Card className="p-4" key={market.code}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{market.code}</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">{market.name}</h2>
                </div>
                <StatusBadge tone={market.status === 'available' ? 'success' : market.status === 'partial' ? 'warning' : 'neutral'}>
                  {market.status}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{market.detail}</p>
            </Card>
          ))}
        </section>

        <section aria-label="Market switcher preview">
          <TerminalMarketSwitcher {...terminalMarketSwitcherFixture} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Ticker card preview">
          {terminalTickerCardFixtures.map((card) => (
            <TerminalTickerCard {...card} key={card.label} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" aria-label="Badge and intelligence previews">
          <Card>
            <Eyebrow>Badges</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Confidence and freshness states</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <ConfidenceBadge
                countryCode="SE"
                details={[{ label: 'Rows', value: '18 verified observations' }, { label: 'Country', value: 'SE' }]}
                label="High confidence"
                level="high"
                observedAt="2026-04-12T00:00:00.000Z"
                sampleSize={18}
                verificationLabel="source-backed"
              />
              <ConfidenceBadge countryCode="NO" label="Medium confidence" level="medium" observedAt="2026-03-01T00:00:00.000Z" sampleSize={6} />
              <ConfidenceBadge countryCode="IS" emptyData label="Low confidence" level="low" sampleSize={0} verificationLabel="empty market" />
              <SourceFreshnessStatusBadge status="within-sla" />
              <SourceFreshnessStatusBadge status="watch" />
              <SourceFreshnessStatusBadge status="breached" />
            </div>
          </Card>
          <Card>
            <Eyebrow>Links</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Preview entry points</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/compare">Compare</Link>
              <Link className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" href="/data-sources">Sources</Link>
              <Link className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" href="/admin/source-health">Source health</Link>
            </div>
          </Card>
        </section>

        <PriceChartTerminal chart={componentPreviewChart} />

        <StoreComparisonTable initialLoyaltyCardIds={['willys-plus']} items={componentPreviewStoreItems} />

        <PriceIntelligenceCard cards={componentPreviewPriceCards} />
        <BestTimeForecastPanel
          confidenceLabel="medium preview confidence"
          expectedMovementLabel="Expected movement: modestly down for staple rows with recent observed drops"
          guidance="The panel exercises dense forecast copy, recommendation counts, and responsive two-column detail blocks."
          headline="Preview the buy-window forecast surface"
          recommendationCount={componentPreviewPriceCards.length}
        />

        <section aria-label="Quote table preview">
          <TerminalQuoteTable {...terminalQuoteTableFixture} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]" aria-label="Verdict and citations preview">
          <TerminalDealVerdict {...terminalDealVerdictFixture} />
          <TerminalSourceCitations {...terminalSourceCitationsFixture} />
        </section>

        <TerminalMethodologyLinks {...terminalMethodologyLinksFixture} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Data state preview">
          {terminalStateFixtures.map((state) => (
            <TerminalStatePanel {...state} key={state.state} />
          ))}
        </section>

        <section aria-label="Source health table preview">
          <div className="mb-4">
            <Eyebrow>Tables</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Source health table snapshot</h2>
          </div>
          <SourceHealthDashboardTable sources={sourceHealthDashboardRows.slice(0, 4)} />
        </section>
      </div>
    </PageShell>
  );
}
