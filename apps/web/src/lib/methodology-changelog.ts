export type MethodologyChangelogEntry = {
  id: string;
  changedAt: string;
  title: string;
  summary: string;
  changeType: 'data_source' | 'matching_rules' | 'index_methodology' | 'deal_score' | 'market_coverage';
  confidence: 'high' | 'medium' | 'low';
  freshnessLabel: string;
  affectedRoutes: string[];
  evidence: string[];
  source: {
    kind: 'structured_changelog' | 'pull_request';
    label: string;
    href: string;
  };
};

export const methodologyChangelogEntries: MethodologyChangelogEntry[] = [
  {
    id: '2026-05-25-compare-chain-capability-anchors',
    changedAt: '2026-05-25T15:14:00.000Z',
    title: 'Per-chain compare capability anchors',
    summary: 'Compare filters now link each ICA, Willys, and Coop capability row to the exact data-sources audit evidence that explains coupon, delivery, and pickup support.',
    changeType: 'market_coverage',
    confidence: 'high',
    freshnessLabel: 'Generated dbSiteCompareStoreCapabilities rows from the current site snapshot.',
    affectedRoutes: ['/compare', '/data-sources'],
    evidence: [
      'apps/web/src/lib/generated/db-site-ingested-overrides.ts',
      'apps/web/src/app/compare/page.tsx',
      'apps/web/src/app/data-sources/page.tsx'
    ],
    source: {
      kind: 'pull_request',
      label: 'PR #3410',
      href: 'https://github.com/SzeChunYiu/GroceryView/pull/3410'
    }
  },
  {
    id: '2026-05-25-matched-basket-index-refinement',
    changedAt: '2026-05-25T12:00:00.000Z',
    title: 'Matched-basket chain index refinement',
    summary: 'The chain index combines broad normalized unit-price observations with exact cross-chain Axfood matched basket rows before calculating the 100-centred index.',
    changeType: 'index_methodology',
    confidence: 'high',
    freshnessLabel: 'Uses source snapshot dates exposed on the chain index and methodology routes.',
    affectedRoutes: ['/chain-index', '/index-methodology'],
    evidence: [
      'apps/web/src/lib/chain-index-data.ts',
      'packages/core/src/index.ts',
      'apps/web/src/app/index-methodology/page.tsx'
    ],
    source: {
      kind: 'structured_changelog',
      label: 'Structured changelog entry',
      href: '/methodology-changelog#2026-05-25-matched-basket-index-refinement'
    }
  },
  {
    id: '2026-05-25-source-claim-ledger',
    changedAt: '2026-05-25T09:00:00.000Z',
    title: 'Source claim boundary ledger',
    summary: 'The data-sources page separates supported claims from blocked claims so users can see why branch-level prices, forecasts, or missing coverage are not inferred.',
    changeType: 'data_source',
    confidence: 'high',
    freshnessLabel: 'Backed by verified-data sourceCoverage, sourceRouteMap, and sourceClaimLedger exports.',
    affectedRoutes: ['/data-sources', '/store-coverage', '/coverage'],
    evidence: [
      'apps/web/src/lib/verified-data.ts',
      'apps/web/src/app/data-sources/page.tsx',
      'docs/data-sources.md'
    ],
    source: {
      kind: 'structured_changelog',
      label: 'Structured changelog entry',
      href: '/methodology-changelog#2026-05-25-source-claim-ledger'
    }
  }
];

export function latestMethodologyChangelogEntry() {
  return methodologyChangelogEntries[0]!;
}
