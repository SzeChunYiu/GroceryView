import { sourceCoverage } from '@/lib/verified-data';
import { buildIngestionPipelineMonitorRows, type IngestionPipelineRun } from './ingest/transform';
import { recentRoutePerformanceBudgetReports } from './telemetry';

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

export type SourceHealthFailureState = 'healthy' | 'warning' | 'failed';

export type SourceHealthDashboardRow = SourceFreshnessSlaRow & {
  failureCount: number;
  failureState: SourceHealthFailureState;
  lastRefreshAt: string;
  latestStatus: IngestionPipelineRun['latestStatus'];
  previousRowCount: number;
  rowCountDelta: number;
  staleDataThresholdHours: number;
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

const sourceRowCountDeltasBySource: Record<string, number> = {
  'Axfood chain price snapshot': 128,
  'ICA store-scoped promotions': -42,
  'OpenPrices SEK observations': 64,
  'OpenFoodFacts metadata catalog': 211,
  'OKQ8 fuel operator prices': 0,
  'Sweden store directory': -7
};

function failureStateForSource(source: SourceFreshnessSlaRow): SourceHealthFailureState {
  const pipeline = ingestionPipelineMonitorRows.find((row) => row.sourceName === source.sourceName);

  if (pipeline?.latestStatus === 'failed' || source.status === 'breached') {
    return 'failed';
  }

  if ((pipeline?.failureCount ?? 0) > 0 || pipeline?.latestStatus === 'warning' || source.status === 'watch') {
    return 'warning';
  }

  return 'healthy';
}

export const sourceHealthDashboardRows: SourceHealthDashboardRow[] = sourceFreshnessSlaDashboard.map((source) => {
  const pipeline = ingestionPipelineMonitorRows.find((row) => row.sourceName === source.sourceName);
  const rowCountDelta = sourceRowCountDeltasBySource[source.sourceName] ?? 0;

  return {
    ...source,
    failureCount: pipeline?.failureCount ?? 0,
    failureState: failureStateForSource(source),
    lastRefreshAt: source.lastSuccessfulIngestAt,
    latestStatus: pipeline?.latestStatus ?? (source.status === 'breached' ? 'failed' : source.status === 'watch' ? 'warning' : 'succeeded'),
    previousRowCount: Math.max(0, source.rowCount - rowCountDelta),
    rowCountDelta,
    staleDataThresholdHours: source.expectedRefreshHours
  };
});

export const sourceHealthDashboardSummary = {
  failingSourceCount: sourceHealthDashboardRows.filter((source) => source.failureState === 'failed').length,
  monitoredAt: sourceFreshnessSlaMonitoredAt,
  rowCountDelta: sourceHealthDashboardRows.reduce((total, source) => total + source.rowCountDelta, 0),
  sourceCount: sourceHealthDashboardRows.length,
  staleSourceCount: sourceHealthDashboardRows.filter((source) => source.status !== 'within-sla').length,
  totalRows: sourceHealthDashboardRows.reduce((total, source) => total + source.rowCount, 0),
  warningSourceCount: sourceHealthDashboardRows.filter((source) => source.failureState === 'warning').length
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

export type ReliabilitySloDimension =
  | 'availability'
  | 'p95_latency'
  | 'freshness'
  | 'ingestion_success'
  | 'source_coverage'
  | 'alert_delivery';

export type ReliabilitySloStatus = 'healthy' | 'watch' | 'burning_budget' | 'unmeasured';

export type ReliabilityBurnRateThreshold = {
  id: string;
  window: string;
  burnRate: number;
  action: string;
};

export type ReliabilitySlo = {
  id: string;
  dimension: ReliabilitySloDimension;
  name: string;
  criticalJourney: string;
  objective: string;
  targetPercent: number;
  observedPercent: number | null;
  observedLabel: string;
  measurementSource: string;
  windowDays: number;
  elapsedWindowPercent: number;
  errorBudgetPercent: number;
  consumedBudgetPercent: number | null;
  remainingBudgetPercent: number | null;
  burnRate: number | null;
  status: ReliabilitySloStatus;
  alertThresholds: ReliabilityBurnRateThreshold[];
  nextAction: string;
};

const reliabilitySloWindowDays = 30;
const reliabilitySloElapsedWindowPercent = 0.5;

const criticalJourneyBurnRateThresholds: ReliabilityBurnRateThreshold[] = [
  {
    id: 'fast-burn',
    window: '1 hour',
    burnRate: 14.4,
    action: 'Page immediately and roll back or disable the failing dependency.',
  },
  {
    id: 'high-burn',
    window: '6 hours',
    burnRate: 6,
    action: 'Page data/API owner and start incident review before the next ingest window.',
  },
  {
    id: 'slow-burn',
    window: '3 days',
    burnRate: 1,
    action: 'Create an SRE follow-up and require a mitigation plan before the next release.',
  },
];

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function countAvailableSources() {
  return sourceHealthDashboardRows.filter((source) => source.rowCount > 0).length;
}

function countFreshSources() {
  return sourceHealthDashboardRows.filter((source) => source.status === 'within-sla').length;
}

function countSuccessfulIngestionSources() {
  return ingestionPipelineMonitorRows.filter((source) => source.latestStatus !== 'failed').length;
}

function routePerformanceBudgetPassPercent() {
  const metrics = recentRoutePerformanceBudgetReports.flatMap((report) => report.metrics);
  return percent(metrics.filter((metric) => !metric.failing).length, metrics.length);
}

function formatObservedPercent(value: number | null) {
  if (value === null) return 'No live metric sample attached';
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })}%`;
}

function buildReliabilitySlo(input: Omit<ReliabilitySlo, 'errorBudgetPercent' | 'consumedBudgetPercent' | 'remainingBudgetPercent' | 'burnRate' | 'status'>): ReliabilitySlo {
  const errorBudgetPercent = Math.max(0, 100 - input.targetPercent);

  if (input.observedPercent === null) {
    return {
      ...input,
      errorBudgetPercent,
      consumedBudgetPercent: null,
      remainingBudgetPercent: null,
      burnRate: null,
      status: 'unmeasured',
    };
  }

  const consumedBudgetPercent = Math.max(0, input.targetPercent - input.observedPercent);
  const remainingBudgetPercent = Math.max(0, errorBudgetPercent - consumedBudgetPercent);
  const consumedBudgetRatio = errorBudgetPercent === 0 ? 0 : consumedBudgetPercent / errorBudgetPercent;
  const burnRate = Math.round((consumedBudgetRatio / input.elapsedWindowPercent) * 10) / 10;
  const status: ReliabilitySloStatus =
    burnRate >= 1 || remainingBudgetPercent === 0
      ? 'burning_budget'
      : burnRate >= 0.5 || remainingBudgetPercent <= errorBudgetPercent * 0.25
        ? 'watch'
        : 'healthy';

  return {
    ...input,
    errorBudgetPercent,
    consumedBudgetPercent,
    remainingBudgetPercent,
    burnRate,
    status,
  };
}

export const reliabilitySloDashboard: ReliabilitySlo[] = [
  buildReliabilitySlo({
    id: 'public-web-availability',
    dimension: 'availability',
    name: 'Public web availability',
    criticalJourney: 'Shoppers can load search, product, compare, and watchlist surfaces.',
    objective: '99.5% successful hosted smoke and health checks per 30 days',
    targetPercent: 99.5,
    observedPercent: null,
    observedLabel: 'Hosted smoke workflow and /api/health exist, but no production check artifact is checked into this snapshot.',
    measurementSource: '.github hosted smoke workflow plus /api/health readiness endpoint',
    windowDays: reliabilitySloWindowDays,
    elapsedWindowPercent: reliabilitySloElapsedWindowPercent,
    alertThresholds: criticalJourneyBurnRateThresholds,
    nextAction: 'Publish the hosted smoke result artifact into the SLO report before availability can burn budget automatically.',
  }),
  buildReliabilitySlo({
    id: 'products-api-p95-latency',
    dimension: 'p95_latency',
    name: 'Products API p95 latency',
    criticalJourney: 'Search and product discovery return current grocery rows quickly enough to keep comparison usable.',
    objective: '95% of product API load samples keep p95 request duration below 800 ms',
    targetPercent: 95,
    observedPercent: routePerformanceBudgetPassPercent(),
    observedLabel: `${formatObservedPercent(routePerformanceBudgetPassPercent())} of current route performance budget metrics pass; the k6 products API p95 gate remains p(95)<800.`,
    measurementSource: 'scripts/load/products-api-10k.js and recentRoutePerformanceBudgetReports',
    windowDays: reliabilitySloWindowDays,
    elapsedWindowPercent: reliabilitySloElapsedWindowPercent,
    alertThresholds: criticalJourneyBurnRateThresholds,
    nextAction: 'Attach the latest k6 result JSON so this row reports true products API p95 instead of route-budget proxy evidence.',
  }),
  buildReliabilitySlo({
    id: 'source-freshness',
    dimension: 'freshness',
    name: 'Source freshness',
    criticalJourney: 'Displayed prices and catalogue metadata stay inside each source freshness window.',
    objective: '99% of monitored ingestion sources are within their stale-data threshold',
    targetPercent: 99,
    observedPercent: percent(countFreshSources(), sourceHealthDashboardRows.length),
    observedLabel: `${countFreshSources().toLocaleString('sv-SE')} of ${sourceHealthDashboardRows.length.toLocaleString('sv-SE')} monitored sources are within SLA.`,
    measurementSource: 'sourceFreshnessSlaDashboard',
    windowDays: reliabilitySloWindowDays,
    elapsedWindowPercent: reliabilitySloElapsedWindowPercent,
    alertThresholds: criticalJourneyBurnRateThresholds,
    nextAction: 'Treat any stale source as a shopper-trust incident when it feeds price, offer, or availability copy.',
  }),
  buildReliabilitySlo({
    id: 'ingestion-success',
    dimension: 'ingestion_success',
    name: 'Ingestion success',
    criticalJourney: 'Scheduled connector runs finish without hard failures before rows become shopper-facing.',
    objective: '99% of monitored ingestion sources avoid hard failed latest status',
    targetPercent: 99,
    observedPercent: percent(countSuccessfulIngestionSources(), ingestionPipelineMonitorRows.length),
    observedLabel: `${countSuccessfulIngestionSources().toLocaleString('sv-SE')} of ${ingestionPipelineMonitorRows.length.toLocaleString('sv-SE')} source monitors avoid hard failure.`,
    measurementSource: 'ingestionPipelineMonitorRows',
    windowDays: reliabilitySloWindowDays,
    elapsedWindowPercent: reliabilitySloElapsedWindowPercent,
    alertThresholds: criticalJourneyBurnRateThresholds,
    nextAction: 'Keep warning runs visible, but page only when the latest source status is failed or budget burn crosses threshold.',
  }),
  buildReliabilitySlo({
    id: 'source-coverage',
    dimension: 'source_coverage',
    name: 'Source coverage',
    criticalJourney: 'Comparison pages show enough verified source rows to avoid false empty markets.',
    objective: '95% of monitored sources have at least one verified row in the current snapshot',
    targetPercent: 95,
    observedPercent: percent(countAvailableSources(), sourceHealthDashboardRows.length),
    observedLabel: `${countAvailableSources().toLocaleString('sv-SE')} of ${sourceHealthDashboardRows.length.toLocaleString('sv-SE')} monitored sources expose verified rows.`,
    measurementSource: 'sourceCoverage and sourceHealthDashboardRows',
    windowDays: reliabilitySloWindowDays,
    elapsedWindowPercent: reliabilitySloElapsedWindowPercent,
    alertThresholds: criticalJourneyBurnRateThresholds,
    nextAction: 'Route zero-row sources to data ops before increasing public coverage claims.',
  }),
  buildReliabilitySlo({
    id: 'alert-delivery',
    dimension: 'alert_delivery',
    name: 'Alert delivery',
    criticalJourney: 'Price-drop, watchlist, and digest notifications either deliver or land in retry/dead-letter evidence.',
    objective: '99% of due notification worker events are delivered or explicitly not due',
    targetPercent: 99,
    observedPercent: null,
    observedLabel: 'Notification Prometheus export is token-protected, but no scrape artifact is checked into this snapshot.',
    measurementSource: '/api/metrics/notifications and notification-metrics-scrape workflow',
    windowDays: reliabilitySloWindowDays,
    elapsedWindowPercent: reliabilitySloElapsedWindowPercent,
    alertThresholds: criticalJourneyBurnRateThresholds,
    nextAction: 'Attach the latest notification-metrics.prom artifact so due alert delivery can consume error budget automatically.',
  }),
];

export const reliabilitySloDashboardSummary = {
  monitoredAt: sourceFreshnessSlaMonitoredAt,
  sloCount: reliabilitySloDashboard.length,
  measuredSloCount: reliabilitySloDashboard.filter((slo) => slo.status !== 'unmeasured').length,
  unmeasuredSloCount: reliabilitySloDashboard.filter((slo) => slo.status === 'unmeasured').length,
  burningBudgetCount: reliabilitySloDashboard.filter((slo) => slo.status === 'burning_budget').length,
  watchCount: reliabilitySloDashboard.filter((slo) => slo.status === 'watch').length,
  healthyCount: reliabilitySloDashboard.filter((slo) => slo.status === 'healthy').length,
  criticalJourneyCount: new Set(reliabilitySloDashboard.map((slo) => slo.criticalJourney)).size,
};
