import { sourceCoverage } from '@/lib/verified-data';
import { buildIngestionPipelineMonitorRows, type IngestionPipelineRun } from './ingest/transform';

export type SourceDuplicateSample = {
  source: string;
  windowMinutes: number;
  currentDuplicateLikeMatches: number;
  baselineDuplicateLikeMatches: number;
  sampledAt: string;
};

export type SourceDuplicateConflictAlert = SourceDuplicateSample & {
  severity: "watch" | "critical";
  spikeRatio: number;
  message: string;
};

export const duplicateConflictSamples: SourceDuplicateSample[] = [
  {
    source: "Axfood scraper",
    windowMinutes: 15,
    currentDuplicateLikeMatches: 42,
    baselineDuplicateLikeMatches: 10,
    sampledAt: "2026-05-24T09:30:00.000Z",
  },
  {
    source: "Open Food Facts import",
    windowMinutes: 15,
    currentDuplicateLikeMatches: 18,
    baselineDuplicateLikeMatches: 12,
    sampledAt: "2026-05-24T09:30:00.000Z",
  },
  {
    source: "Store catalogue crawler",
    windowMinutes: 15,
    currentDuplicateLikeMatches: 31,
    baselineDuplicateLikeMatches: 9,
    sampledAt: "2026-05-24T09:30:00.000Z",
  },
];

export function getDuplicateConflictAlerts(
  samples: SourceDuplicateSample[] = duplicateConflictSamples,
): SourceDuplicateConflictAlert[] {
  return samples
    .map((sample) => {
      const baseline = Math.max(sample.baselineDuplicateLikeMatches, 1);
      const spikeRatio = sample.currentDuplicateLikeMatches / baseline;

      if (spikeRatio < 2.5 || sample.currentDuplicateLikeMatches < 25) {
        return null;
      }

      const severity = spikeRatio >= 4 ? "critical" : "watch";

      return {
        ...sample,
        severity,
        spikeRatio,
        message: `${sample.source} reported ${sample.currentDuplicateLikeMatches} duplicate-like matches in ${sample.windowMinutes} minutes, ${spikeRatio.toFixed(1)}× its normal volume.`,
      } satisfies SourceDuplicateConflictAlert;
    })
    .filter((alert): alert is SourceDuplicateConflictAlert => alert !== null);
}

export type SourceFreshnessSlaStatus = 'within-sla' | 'watch' | 'breached';

type SourceFreshnessSlaConfig = {
  sourceName: string;
  chain: string;
  dataSource: string;
  expectedRefreshHours: number;
  lastSuccessfulIngestAt: string;
  failureStatus: string;
};

export type SourceFreshnessSlaRow = SourceFreshnessSlaConfig & {
  rowCount: number;
  monitoredAt: string;
  ingestLagHours: number;
  status: SourceFreshnessSlaStatus;
};

export const sourceFreshnessSlaMonitoredAt = '2026-05-24T12:00:00.000Z';

const sourceFreshnessSlaConfigs: SourceFreshnessSlaConfig[] = [
  {
    sourceName: 'Axfood chain price snapshot',
    chain: 'Willys / Hemköp',
    dataSource: 'Axfood public search scraper',
    expectedRefreshHours: 24,
    lastSuccessfulIngestAt: '2026-05-24T09:30:00.000Z',
    failureStatus: 'No failed runs in the current ingest window',
  },
  {
    sourceName: 'ICA store-scoped promotions',
    chain: 'ICA',
    dataSource: 'Store promotion endpoint crawler',
    expectedRefreshHours: 24,
    lastSuccessfulIngestAt: '2026-05-24T08:45:00.000Z',
    failureStatus: 'Latest branch sample succeeded; 2 store endpoints skipped with empty promotion payloads',
  },
  {
    sourceName: 'OpenPrices SEK observations',
    chain: 'Community observations',
    dataSource: 'OpenPrices import',
    expectedRefreshHours: 72,
    lastSuccessfulIngestAt: '2026-05-23T18:15:00.000Z',
    failureStatus: 'No failed imports in the current ingest window',
  },
  {
    sourceName: 'OpenFoodFacts metadata catalog',
    chain: 'Open Food Facts',
    dataSource: 'Sweden metadata catalog sync',
    expectedRefreshHours: 168,
    lastSuccessfulIngestAt: '2026-05-20T07:00:00.000Z',
    failureStatus: 'No failed imports in the current ingest window',
  },
  {
    sourceName: 'OKQ8 fuel operator prices',
    chain: 'OKQ8',
    dataSource: 'Fuel operator price feed',
    expectedRefreshHours: 24,
    lastSuccessfulIngestAt: '2026-05-24T06:00:00.000Z',
    failureStatus: 'No failed imports in the current ingest window',
  },
  {
    sourceName: 'Sweden store directory',
    chain: 'Store directory',
    dataSource: 'OpenStreetMap Overpass extract',
    expectedRefreshHours: 168,
    lastSuccessfulIngestAt: '2026-05-18T10:00:00.000Z',
    failureStatus: 'Within weekly SLA; next run queued for manual review after Overpass throttling',
  },
];

function rowCountForSource(sourceName: string) {
  return sourceCoverage.find((source) => source.name === sourceName)?.rows ?? 0;
}

function ingestLagHours(lastSuccessfulIngestAt: string) {
  return Math.round(
    ((Date.parse(sourceFreshnessSlaMonitoredAt) - Date.parse(lastSuccessfulIngestAt)) / (1000 * 60 * 60)) * 10,
  ) / 10;
}

function sourceFreshnessStatus(lagHours: number, expectedRefreshHours: number): SourceFreshnessSlaStatus {
  if (lagHours > expectedRefreshHours) return 'breached';
  if (lagHours > expectedRefreshHours * 0.75) return 'watch';
  return 'within-sla';
}

export const sourceFreshnessSlaDashboard: SourceFreshnessSlaRow[] = sourceFreshnessSlaConfigs.map((source) => {
  const ingestLag = ingestLagHours(source.lastSuccessfulIngestAt);

  return {
    ...source,
    rowCount: rowCountForSource(source.sourceName),
    monitoredAt: sourceFreshnessSlaMonitoredAt,
    ingestLagHours: ingestLag,
    status: sourceFreshnessStatus(ingestLag, source.expectedRefreshHours),
  };
});

export const sourceFreshnessSlaSummary = {
  monitoredAt: sourceFreshnessSlaMonitoredAt,
  sourceCount: sourceFreshnessSlaDashboard.length,
  rowCount: sourceFreshnessSlaDashboard.reduce((total, source) => total + source.rowCount, 0),
  breachedSourceCount: sourceFreshnessSlaDashboard.filter((source) => source.status === 'breached').length,
};

const ingestionPipelineRuntimeBySource: Record<string, Pick<IngestionPipelineRun, 'failureCount' | 'latencyMs' | 'latestStatus'>> = {
  'Axfood chain price snapshot': { failureCount: 0, latencyMs: 18300, latestStatus: 'succeeded' },
  'ICA store-scoped promotions': { failureCount: 2, latencyMs: 42100, latestStatus: 'warning' },
  'OpenPrices SEK observations': { failureCount: 0, latencyMs: 27500, latestStatus: 'succeeded' },
  'OpenFoodFacts metadata catalog': { failureCount: 0, latencyMs: 63900, latestStatus: 'succeeded' },
  'OKQ8 fuel operator prices': { failureCount: 0, latencyMs: 9100, latestStatus: 'succeeded' },
  'Sweden store directory': { failureCount: 1, latencyMs: 118000, latestStatus: 'warning' }
};

function runtimeForSource(source: SourceFreshnessSlaRow): Pick<IngestionPipelineRun, 'failureCount' | 'latencyMs' | 'latestStatus'> {
  return ingestionPipelineRuntimeBySource[source.sourceName] ?? {
    failureCount: source.failureStatus.toLowerCase().startsWith('no failed') ? 0 : 1,
    latencyMs: Math.max(1000, source.ingestLagHours * 1000),
    latestStatus: source.status === 'breached' ? 'failed' : source.status === 'watch' ? 'warning' : 'succeeded'
  };
}

export const ingestionPipelineMonitorRows = buildIngestionPipelineMonitorRows(sourceFreshnessSlaDashboard.map((source) => ({
  chain: source.chain,
  dataSource: source.dataSource,
  lastFinishedAt: source.lastSuccessfulIngestAt,
  rowCount: source.rowCount,
  sourceName: source.sourceName,
  ...runtimeForSource(source)
})));

export const ingestionPipelineMonitorSummary = {
  failedSourceCount: ingestionPipelineMonitorRows.filter((source) => source.latestStatus === 'failed').length,
  monitoredAt: sourceFreshnessSlaMonitoredAt,
  sourceCount: ingestionPipelineMonitorRows.length,
  totalFailures: ingestionPipelineMonitorRows.reduce((total, source) => total + source.failureCount, 0),
  totalRows: ingestionPipelineMonitorRows.reduce((total, source) => total + source.rowCount, 0)
};

export type SourceManagementAction = {
  id: string;
  sourceName: string;
  chain: string;
  dataSource: string;
  owner: string;
  runbookUrl: string;
  state: 'active' | 'paused';
  note: string;
  allowedActions: Array<'pause' | 'resume' | 'annotate'>;
  updatedAt: string;
};

const sourceOwners: Record<string, { owner: string; runbookUrl: string; state?: SourceManagementAction['state']; note: string }> = {
  'Axfood chain price snapshot': {
    owner: 'Data Ops · Axfood',
    runbookUrl: '/admin/runbooks/axfood-chain-price-snapshot',
    note: 'Pause before Axfood endpoint incidents or price schema changes.'
  },
  'ICA store-scoped promotions': {
    owner: 'Data Ops · ICA promotions',
    runbookUrl: '/admin/runbooks/ica-store-promotions',
    note: 'Annotate skipped store endpoints before resuming branch samples.'
  },
  'OpenPrices SEK observations': {
    owner: 'Community data steward',
    runbookUrl: '/admin/runbooks/openprices-import',
    note: 'Resume only after duplicate and unit-normalization QA checks pass.'
  },
  'OpenFoodFacts metadata catalog': {
    owner: 'Catalog enrichment',
    runbookUrl: '/admin/runbooks/openfoodfacts-metadata',
    note: 'Pause metadata syncs during allergen taxonomy drift reviews.'
  },
  'OKQ8 fuel operator prices': {
    owner: 'Mobility price ops',
    runbookUrl: '/admin/runbooks/okq8-fuel-prices',
    note: 'Annotate public-price page outages with captured HTTP status.'
  },
  'Sweden store directory': {
    owner: 'Store directory ops',
    runbookUrl: '/admin/runbooks/overpass-store-directory',
    state: 'paused',
    note: 'Paused while Overpass throttling is reviewed; resume after quota confirmation.'
  }
};

export const sourceManagementActions: SourceManagementAction[] = sourceFreshnessSlaDashboard.map((source) => {
  const owner = sourceOwners[source.sourceName] ?? {
    owner: 'Data Ops',
    runbookUrl: '/admin/runbooks/source-management',
    note: 'Annotate source ownership before changing connector state.'
  };
  const state = owner.state ?? 'active';

  return {
    id: source.sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    sourceName: source.sourceName,
    chain: source.chain,
    dataSource: source.dataSource,
    owner: owner.owner,
    runbookUrl: owner.runbookUrl,
    state,
    note: owner.note,
    allowedActions: state === 'paused' ? ['resume', 'annotate'] : ['pause', 'annotate'],
    updatedAt: source.monitoredAt
  };
});

export const sourceManagementSummary = {
  actionCount: sourceManagementActions.length,
  pausedCount: sourceManagementActions.filter((source) => source.state === 'paused').length,
  ownerCount: new Set(sourceManagementActions.map((source) => source.owner)).size
};

export type PartnerOnboardingIntake = {
  intakeEmail: string;
  expectedResponseWindow: string;
  requiredContactFields: string[];
  coverageAreaFields: string[];
  samplePriceFileRequirements: string[];
  acceptedFileTypes: string[];
  routingSteps: string[];
};

export const partnerOnboardingIntake: PartnerOnboardingIntake = {
  intakeEmail: "partners@groceryview.se",
  expectedResponseWindow: "2 business days",
  requiredContactFields: [
    "Retailer or store group name",
    "Primary feed contact name, role, email, and phone",
    "Technical contact for catalog, promotion, and inventory exports",
    "Preferred launch window and any embargo constraints",
  ],
  coverageAreaFields: [
    "Countries, regions, cities, or delivery zones covered by the feed",
    "Store formats included, such as supermarket, convenience, dark store, or online delivery",
    "Store identifiers that can be shared with shoppers and store identifiers that must stay internal",
    "Refresh cadence for prices, promotions, and availability",
  ],
  samplePriceFileRequirements: [
    "At least 50 representative rows with current price, currency, package size, and product identifiers",
    "Promotion examples with valid-from and valid-through dates when available",
    "A field dictionary for product IDs, store IDs, VAT, unit prices, and stock status",
    "A note describing whether the sample is synthetic, redacted, or production data",
  ],
  acceptedFileTypes: ["CSV", "XLSX", "JSON", "Parquet", "OpenAPI link"],
  routingSteps: [
    "Source health review confirms contact ownership and coverage boundaries.",
    "Data operations checks sample files for required price, unit, and freshness fields.",
    "A partner-specific import plan is created before any shopper-facing claim goes live.",
  ],
};
