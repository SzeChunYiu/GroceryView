import type {
  TerminalDealVerdictProps,
  TerminalMarketSwitcherProps,
  TerminalMethodologyLinksProps,
  TerminalQuoteTableProps,
  TerminalSourceCitationsProps,
  TerminalStateMessage,
  TerminalTickerCardProps
} from './terminal-surface';
import {
  dataFreshnessBadges,
  formatPct,
  formatSek,
  priceDropMoversBoard,
  sourceCoverage,
  topChainSpreads
} from '@/lib/verified-data';

const sourceRouteByName = new Map(dataFreshnessBadges.map((source) => [source.sourceName, source.evidenceRoute]));

function confidenceForSource(name: string): TerminalTickerCardProps['confidence'] {
  if (name.includes('Axfood') || name.includes('ICA') || name.includes('OKQ8')) return 'high';
  if (name.includes('OpenPrices') || name.includes('OpenFoodFacts')) return 'medium';
  return 'low';
}

export const terminalTickerCardFixtures: TerminalTickerCardProps[] = sourceCoverage.slice(0, 4).map((source) => ({
  confidence: confidenceForSource(source.name),
  detail: source.coverage,
  freshnessLabel: source.freshness,
  href: sourceRouteByName.get(source.name) ?? '/data-sources',
  label: source.name,
  sourceLabel: source.source,
  state: source.name.includes('OpenPrices') ? 'partial' : 'ready',
  value: source.rows.toLocaleString('sv-SE')
}));

export const terminalQuoteTableFixture: TerminalQuoteTableProps = {
  caption: 'Top verified Axfood cross-chain spreads',
  rows: topChainSpreads.slice(0, 6).map((product) => ({
    comparisonLabel: `${product.lowestChain} lowest · ${formatPct(product.spreadPct)} spread to highest observed chain`,
    confidence: product.inChains.length > 1 ? 'high' : 'medium',
    freshnessLabel: sourceCoverage[0]?.freshness ?? 'snapshot freshness not reported',
    href: `/products/${product.slug}`,
    id: product.code,
    label: `${product.name} · ${product.brand || 'Brand not reported'}`,
    quote: formatSek(product.lowestPrice),
    sourceLabel: 'Axfood chain price snapshot'
  }))
};

const mover = priceDropMoversBoard[0];

export const terminalDealVerdictFixture: TerminalDealVerdictProps = mover ? {
  boundary: mover.legalCopy === 'observed low only'
    ? 'Observed low only. This verdict does not claim live stock, future price movement, or store-specific availability.'
    : 'Verdict is limited to the named source evidence.',
  evidenceLabel: `${mover.observedCount.toLocaleString('sv-SE')} dated observations · latest ${mover.latestObservedAt}`,
  ruleLabel: `${formatSek(mover.latestPrice)} latest vs ${formatSek(mover.previousPrice)} previous observed price`,
  title: mover.productName,
  tone: mover.isNewLow ? 'positive' : 'neutral',
  verdict: mover.isNewLow ? 'New observed low' : 'Observed drop'
} : {
  boundary: 'No deal verdict is shown without a dated observed price drop.',
  evidenceLabel: 'No price-drop mover rows in the verified fixture set.',
  ruleLabel: 'Fail closed until source-backed mover rows exist.',
  title: 'No observed price-drop mover',
  tone: 'blocked',
  verdict: 'Blocked'
};

export const terminalSourceCitationsFixture: TerminalSourceCitationsProps = {
  citations: dataFreshnessBadges.slice(0, 5).map((source) => ({
    coverageLabel: source.coverageLabel,
    href: source.source.startsWith('http') ? source.source : source.evidenceRoute,
    id: source.sourceKind,
    label: source.sourceName,
    sourceType: source.confidenceBadge
  }))
};

export const terminalMarketSwitcherFixture: TerminalMarketSwitcherProps = {
  label: 'Market terminal country',
  markets: [
    {
      active: true,
      detail: `${sourceCoverage.length} current Swedish source classes`,
      href: '/chain-index',
      id: 'se',
      label: 'Sweden',
      state: 'available'
    },
    {
      detail: 'Country route is available, but grocery source rows remain coverage-gated.',
      href: '/no',
      id: 'no',
      label: 'Norway',
      state: 'partial'
    },
    {
      detail: 'Country route is available, but grocery source rows remain coverage-gated.',
      href: '/is',
      id: 'is',
      label: 'Iceland',
      state: 'partial'
    }
  ]
};

export const terminalMethodologyLinksFixture: TerminalMethodologyLinksProps = {
  links: [
    {
      detail: 'Source coverage, freshness, and caveats for the rows rendered in terminal surfaces.',
      href: '/data-sources',
      label: 'Data sources'
    },
    {
      detail: 'Observed fixed-basket and chain index calculations with source-confidence labels.',
      href: '/chain-index',
      label: 'Chain index'
    },
    {
      detail: 'OpenPrices observation depth and freshness boundaries for community-sourced rows.',
      href: '/openprices-depth',
      label: 'OpenPrices depth'
    }
  ]
};

export const terminalStateFixtures: TerminalStateMessage[] = [
  {
    actionHref: '/data-sources',
    actionLabel: 'Review source coverage',
    detail: 'The terminal is waiting for a verified source response before rendering prices.',
    state: 'loading',
    title: 'Loading source-backed rows'
  },
  {
    detail: 'No verified source rows match the selected market and product filters.',
    state: 'empty',
    title: 'No verified rows'
  },
  {
    actionHref: '/data-sources',
    actionLabel: 'Open source notes',
    detail: 'Some source classes are present while branch shelf, loyalty, or inventory data is missing.',
    state: 'partial',
    title: 'Partial coverage'
  },
  {
    actionHref: '/admin/source-health',
    actionLabel: 'Open source health',
    detail: 'The newest dated observation is outside the display freshness window.',
    state: 'stale',
    title: 'Source data is stale'
  },
  {
    detail: 'The source adapter returned an error, so the terminal fails closed instead of showing stale values as current.',
    state: 'error',
    title: 'Source error'
  },
  {
    detail: 'This source is blocked until authentication, permission, or source policy requirements are satisfied.',
    state: 'blocked',
    title: 'Blocked source'
  }
];
