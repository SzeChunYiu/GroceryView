import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceFreshnessStatusBadge, SourceManagementActionsPanel } from '@/components/data-ui';
import { DataGrid, DataGridProductCell, UnitAuditFilterTable, dataGridActionClass, type UnitAuditIssueRow } from '@/components/data-grid';
import { axfoodProducts } from '@/lib/axfood-products';
import { buildDuplicateMergeQueue, type ProductRecord } from '@/lib/deduplicate-products';
import { buildUnitNormalizationQaReport, unitNormalizationQaIssuesForProduct } from '@/lib/normalization';
import { pricedProducts } from '@/lib/openprices-products';
import { dbSiteAxfoodProducts, dbSiteSnapshotGeneratedAt } from '@/lib/generated/db-site-products';
import {
  allStoreDailyRunnerReadiness,
  apiPerformanceReadiness,
  categoryQualityMatrix,
  commodityIngestionClassifierEvidence,
  commodityMappingReviewPlan,
  formatPct,
  icaStorePromotionEvidence,
  multiVerticalDomainFoundation,
  publicApiDirectory,
  snapshot,
  sourceClaimLedger,
  sourceCoverage,
  sourceReadinessMatrix,
  sourceRouteMap,
  storeBrandLedger,
  timescaleDbEvaluation,
  unitNormalizationAuditFilterOptions,
  unitNormalizationMathemAuditInputs
} from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import {
  ingestionPipelineMonitorRows,
  ingestionPipelineMonitorSummary,
  partnerOnboardingIntake,
  sourceFreshnessSlaDashboard,
  sourceFreshnessSlaSummary,
  sourceManagementActions,
  sourceManagementSummary
} from '@/lib/source-health';

const unitNormalizationQaInputs = [
  ...axfoodProducts.map((product) => ({
    productId: product.slug,
    productName: product.name,
    packageText: product.subline,
    price: product.lowestPrice,
    source: 'Axfood'
  })),
  ...pricedProducts.map((product) => ({
    productId: product.slug,
    productName: product.name,
    packageText: product.quantity,
    price: product.priceMedian,
    source: 'OpenPrices'
  })),
  ...unitNormalizationMathemAuditInputs
];

const unitNormalizationQaReport = buildUnitNormalizationQaReport(unitNormalizationQaInputs);

const unitNormalizationQaIssueLabels = Object.fromEntries(
  unitNormalizationAuditFilterOptions.issueTypes.map((option) => [option.value, option.label])
);

const unitNormalizationQaRows: UnitAuditIssueRow[] = unitNormalizationQaInputs.flatMap((product) => (
  unitNormalizationQaIssuesForProduct(product).map((issue) => ({
    id: `${product.source}-${issue.kind}-${issue.productId}`,
    source: product.source,
    kind: issue.kind,
    kindLabel: unitNormalizationQaIssueLabels[issue.kind] ?? issue.kind,
    severity: issue.severity,
    productName: issue.productName,
    productId: issue.productId,
    packageText: issue.packageText,
    detail: issue.detail
  }))
));

function axfoodSourceUrl(product: (typeof axfoodProducts)[number]) {
  return Object.values(product.chains).find((chain) => chain.url)?.url || `/products/${product.slug}`;
}

const duplicateReviewSourceProducts = dbSiteAxfoodProducts.length > 0 ? dbSiteAxfoodProducts : axfoodProducts;

const duplicateReviewProducts: ProductRecord[] = [
  ...duplicateReviewSourceProducts.slice(0, 120).map((product) => ({
    id: `axfood:${product.code}`,
    name: product.name,
    brand: product.brand,
    category: product.category,
    imageUrl: product.image,
    sourceUrl: axfoodSourceUrl(product),
    size: product.subline,
    unit: product.subline,
    ean: product.code,
    unitLabel: product.subline,
    upc: product.code
  })),
  ...pricedProducts.slice(0, 120).map((product) => ({
    id: `openprices:${product.code}`,
    name: product.name,
    brand: product.brands,
    category: product.category,
    imageUrl: product.image,
    sourceUrl: `https://world.openfoodfacts.org/product/${product.code}`,
    size: product.quantity,
    unit: product.quantity,
    ean: product.code,
    unitLabel: product.quantity || 'OpenPrices unit not reported',
    upc: product.code
  }))
];

const duplicateMergeQueue = buildDuplicateMergeQueue(duplicateReviewProducts, 0.45).slice(0, 8);

const duplicateReviewActionLabels = {
  merge: 'Merge',
  ignore: 'Ignore',
  confidence: 'Check confidence'
};

export function generateMetadata() {
  return routeMetadata('/data-sources');
}

export const dynamic = 'force-static';

export default function DataSourcesPage() {
  return (
    <PageShell>
      <Eyebrow>Data sources</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Verified snapshot provenance</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page exposes the current generated source coverage behind GroceryView. Counts, caveats, freshness labels, store brand coverage, and category quality signals are rendered from the same verified data module as the product, store, and comparison routes.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Snapshot window" value={snapshot.retrievedLabel} />
        <Metric label="Source groups" value={sourceCoverage.length.toLocaleString('sv-SE')} />
        <Metric label="Brand ledgers" value={storeBrandLedger.length.toLocaleString('sv-SE')} />
      </div>

      <Card className="mt-6 border-rose-200 bg-rose-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-800">Admin ingestion monitor</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Latest pipeline status before prices go stale</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Operators can compare latest ingest status, transformed row counts, run failures, and transform latency for every source before stale or broken feeds reach shoppers.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-sm font-black text-rose-950 shadow-sm">
            <p>monitored {ingestionPipelineMonitorSummary.monitoredAt}</p>
            <p>{ingestionPipelineMonitorSummary.totalFailures.toLocaleString('sv-SE')} failures in latest runs</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <Metric label="Pipelines" value={ingestionPipelineMonitorSummary.sourceCount.toLocaleString('sv-SE')} />
          <Metric label="Rows transformed" value={ingestionPipelineMonitorSummary.totalRows.toLocaleString('sv-SE')} />
          <Metric label="Failed sources" value={ingestionPipelineMonitorSummary.failedSourceCount.toLocaleString('sv-SE')} />
        </div>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-rose-100 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-rose-50 text-xs font-black uppercase tracking-[0.16em] text-rose-900">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Latest status</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Failures</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Last finished</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100 font-semibold text-slate-700">
              {ingestionPipelineMonitorRows.map((source) => (
                <tr key={source.sourceName}>
                  <td className="px-4 py-3">
                    <p className="font-black text-slate-950">{source.chain}</p>
                    <p className="text-xs text-slate-500">{source.dataSource}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${source.latestStatus === 'succeeded' ? 'bg-emerald-50 text-emerald-800' : source.latestStatus === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>
                      {source.latestStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{source.rowCount.toLocaleString('sv-SE')}</td>
                  <td className="px-4 py-3">{source.failureCount.toLocaleString('sv-SE')}</td>
                  <td className="px-4 py-3">{source.latencySeconds.toLocaleString('sv-SE')}s</td>
                  <td className="px-4 py-3">{source.lastFinishedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-800">Source freshness SLA</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Ingest lag, rows, and failure status by chain</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Each visible source now reports its latest successful ingest, row count, SLA target, and failure status before stale inputs can silently drive price comparison claims.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-cyan-950 shadow-sm">
            monitored {sourceFreshnessSlaSummary.monitoredAt}
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <Metric label="Monitored sources" value={sourceFreshnessSlaSummary.sourceCount.toLocaleString('sv-SE')} />
          <Metric label="Rows under SLA" value={sourceFreshnessSlaSummary.rowCount.toLocaleString('sv-SE')} />
          <Metric label="SLA breaches" value={sourceFreshnessSlaSummary.breachedSourceCount.toLocaleString('sv-SE')} />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {sourceFreshnessSlaDashboard.map((source) => (
            <section className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm" key={`${source.chain}-${source.dataSource}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{source.chain}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{source.dataSource}</h3>
                </div>
                <SourceFreshnessStatusBadge status={source.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-cyan-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-800">Ingest lag</p>
                  <p className="mt-1 text-lg font-black text-cyan-950">{source.ingestLagHours}h</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">Rows</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{source.rowCount.toLocaleString('sv-SE')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">SLA target</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{source.expectedRefreshHours}h</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                Latest successful ingest: {source.lastSuccessfulIngestAt}
              </p>
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
                Failure status: {source.failureStatus}
              </p>
            </section>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-slate-50/80">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-700">Source management</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Pause, resume, annotate, and route ownership</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Retailer connector operations now expose safe controls with owner labels and runbook links so incidents and planned maintenance do not rely on ad-hoc spreadsheet notes.
            </p>
          </div>
          <div className="grid gap-2 rounded-2xl bg-white p-3 text-sm font-black text-slate-700 shadow-sm">
            <p>{sourceManagementSummary.actionCount.toLocaleString('sv-SE')} managed sources</p>
            <p>{sourceManagementSummary.pausedCount.toLocaleString('sv-SE')} paused</p>
            <p>{sourceManagementSummary.ownerCount.toLocaleString('sv-SE')} owners</p>
          </div>
        </div>
        <SourceManagementActionsPanel actions={sourceManagementActions} />
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Admin duplicate review</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Suspected duplicate product clusters</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Reviewers can triage likely duplicate catalog records before fragmented price history reaches search: merge strong matches, ignore weak pairs, or send borderline confidence scores back to source QA.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900 shadow-sm">
            {duplicateMergeQueue.length.toLocaleString('sv-SE')} clusters queued
          </p>
        </div>
        <DataGrid className="mt-5 overflow-x-auto bg-white" dense>
          <table>
            <thead>
              <tr className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <th>Merge cluster</th>
                <th>Canonical record</th>
                <th>Confidence</th>
                <th>Merge note</th>
                <th>Review actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700">
              {duplicateMergeQueue.map((group) => {
                const topCandidate = group.candidates[0];
                const clusterLead = topCandidate?.source ?? group.canonicalProduct;

                return (
                  <tr key={group.id}>
                    <td>
                      <DataGridProductCell
                        brand={clusterLead.brand}
                        imageUrl={clusterLead.imageUrl}
                        name={group.products.map((product) => product.name).join(' + ')}
                        sourceUrl={clusterLead.sourceUrl}
                        unitLabel={`${group.products.length} records · ${group.signals.join(', ') || 'similar names'}`}
                      />
                    </td>
                    <td>
                      <DataGridProductCell
                        brand={group.canonicalProduct.brand}
                        imageUrl={group.canonicalProduct.imageUrl}
                        name={group.canonicalProduct.name}
                        sourceUrl={group.canonicalProduct.sourceUrl}
                        unitLabel={group.canonicalProduct.unitLabel || group.canonicalProduct.size}
                      />
                    </td>
                    <td>
                      <p className="font-black text-sky-900">{Math.round((topCandidate?.confidence ?? 0) * 100)}%</p>
                      <p className="text-xs text-slate-500">{topCandidate?.confidenceLabel ?? 'Needs review'}</p>
                    </td>
                    <td>
                      <p>{group.mergeNote}</p>
                      <p className="mt-1 text-xs text-slate-500">Snapshot: {dbSiteSnapshotGeneratedAt ?? 'static fallback'}</p>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button className={`${dataGridActionClass} bg-emerald-50 text-emerald-800`} type="button">Merge into canonical</button>
                        <button className={`${dataGridActionClass} bg-white`} type="button">Ignore</button>
                        <button className={`${dataGridActionClass} bg-amber-50 text-amber-800`} type="button">
                          {duplicateReviewActionLabels[group.recommendedAction]}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataGrid>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Partner intake</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Store partner self-service submission</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              New retailers can now submit feed contact details, coverage areas, and sample price files through a repeatable onboarding form before GroceryView expands source coverage.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-900 px-5 py-3 text-center text-sm font-black text-white shadow-sm" href="/partners/submit">
            Submit a partner feed
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <Metric label="Required contact fields" value={partnerOnboardingIntake.requiredContactFields.length.toLocaleString('sv-SE')} />
          <Metric label="Coverage prompts" value={partnerOnboardingIntake.coverageAreaFields.length.toLocaleString('sv-SE')} />
          <Metric label="Accepted sample formats" value={partnerOnboardingIntake.acceptedFileTypes.join(', ')} />
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-800">All-store daily batch runner</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{allStoreDailyRunnerReadiness.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              All-store daily ingestion now has a visible readiness contract: the workflow enumerates live stores, emits daily connector configs, and passes bounded runner controls into branch-scoped connectors before source-run evidence can be accepted.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-lime-900 shadow-sm">{allStoreDailyRunnerReadiness.status}</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {allStoreDailyRunnerReadiness.runnerControls.map((control) => (
            <section className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm" key={control.name}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">{control.name}</p>
              <p className="mt-2 text-sm font-black text-slate-950">{control.defaultValue}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{control.purpose}</p>
            </section>
          ))}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">All-store connector URLs</p>
            <div className="mt-3 space-y-3">
              {allStoreDailyRunnerReadiness.allStoreConnectorUrls.map((connector) => (
                <div className="rounded-xl bg-slate-50 p-3" key={connector.url}>
                  <p className="text-sm font-black text-slate-950">{connector.chain} · {connector.scope}</p>
                  <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-600">{connector.url}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">Workflow evidence</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{allStoreDailyRunnerReadiness.workflowPath}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{allStoreDailyRunnerReadiness.runnerPath}</p>
            <div className="mt-3 grid gap-2">
              {allStoreDailyRunnerReadiness.workflowSteps.map((step) => (
                <p className="rounded-xl bg-lime-50 p-3 text-sm font-bold text-lime-950" key={step}>{step}</p>
              ))}
            </div>
          </section>
        </div>
        <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-lime-950 md:grid-cols-3">
          {allStoreDailyRunnerReadiness.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-3" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-red-200 bg-red-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-800">wire: ICA source import</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{icaStorePromotionEvidence.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              ICA store-scoped promotions are now part of the visible source ledger. The latest import keeps storeAccountId, regionId, retrievedAt, rowCount, and sourceUrl evidence on this page before any shopper-facing branch shelf-price or stock claim can be made.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-red-900 shadow-sm">
            {icaStorePromotionEvidence.storeScopedRows.toLocaleString('sv-SE')} rows
          </p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {icaStorePromotionEvidence.latestStores.map((store) => (
            <a className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-700" href={store.sourceUrl} key={`${store.storeAccountId}-${store.retrievedAt}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800">storeAccountId {store.storeAccountId}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{store.storeName}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{store.rowCount.toLocaleString('sv-SE')} rows · regionId {store.regionId}</p>
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-red-950">sourceUrl · retrieved {store.retrievedAt}</p>
            </a>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {icaStorePromotionEvidence.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-red-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Multi-vertical domain foundation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              GroceryView scopes chains, stores, products, and observations by domain so fuel and pharmacy can reuse the terminal model without mixing evidence. Fuel now renders only operator-sourced domain rows; pharmacy separates public OTC evidence from connector-backed pharmacy-chain claims.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900 shadow-sm">domain default 'grocery'</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {multiVerticalDomainFoundation.map((domain) => (
            <Link
              className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-700"
              href={domain.route}
              key={domain.slug}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{domain.status}</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{domain.label}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{domain.seedItemCount} seed item models · {domain.priceObservationsAvailable.toLocaleString('sv-SE')} price observations available</p>
              <p className="mt-3 rounded-2xl bg-indigo-50 p-3 text-sm font-semibold leading-6 text-indigo-950">{domain.claimBoundary}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-800">Unit normalization QA</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Missing units, suspicious pack sizes, and unit-price conversion checks</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              The QA report parses package text before basket comparison trusts comparable unit prices. Rows with missing units or suspicious pack sizes stay reviewable instead of receiving synthetic kr/kg, kr/l, or kr/st values.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-900 shadow-sm">
            {unitNormalizationQaReport.issueCount.toLocaleString('sv-SE')} QA issues
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Missing units" value={unitNormalizationQaReport.missingUnitCount.toLocaleString('sv-SE')} />
          <Metric label="Suspicious pack sizes" value={unitNormalizationQaReport.suspiciousPackSizeCount.toLocaleString('sv-SE')} />
          <Metric label="Inconsistent conversions" value={unitNormalizationQaReport.inconsistentUnitPriceCount.toLocaleString('sv-SE')} />
        </div>
        <UnitAuditFilterTable
          issueTypeOptions={unitNormalizationAuditFilterOptions.issueTypes}
          rows={unitNormalizationQaRows}
          severityOptions={unitNormalizationAuditFilterOptions.severities}
          sourceOptions={unitNormalizationAuditFilterOptions.sources}
        />
        <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-amber-950 md:grid-cols-3">
          {unitNormalizationQaReport.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-3" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Coverage ledger</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Every visible source names its upstream endpoint family, current row count, freshness signal, and caveat.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/products">
            Browse rendered products
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {sourceCoverage.map((source) => (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
              <p className="text-sm font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-4xl font-black text-emerald-800">{source.rows.toLocaleString('sv-SE')}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{source.coverage}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Source: {source.source}.</p>
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                Freshness: {source.freshness}. {source.caveat}
              </p>
            </section>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-800">Fuel source documentation</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Preem · station-local consumer evidence + separate business list prices</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Preem entries must stay scoped: consumer pump-price evidence is station-local, while business list prices are separate business evidence. GroceryView should not claim that Preem exposes chain-wide consumer pump prices.
            </p>
          </div>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-900 shadow-sm" href="https://github.com/SzeChunYiu/GroceryView/blob/main/docs/connectors/preem-se.md">
            Read docs/connectors/preem-se.md
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Consumer scope" value="station-local" />
          <Metric label="Business prices" value="separate list" />
          <Metric label="Chain-wide pump feed" value="not claimed" />
        </div>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">feat(steal)</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Public price/nutrition API · {publicApiDirectory.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {'The developer-facing OpenAPI contract is public at /api/openapi.json. It documents public price terminal /api/products/{id}/terminal, price-history, and nutrition per krona /api/nutrition/value endpoints while keeping account APIs protected.'}
              {' '}
              <code className="rounded bg-white px-1 font-black">{publicApiDirectory.openApiPath}</code>
            </p>
          </div>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900 shadow-sm" href={publicApiDirectory.openApiPath}>
            Open {publicApiDirectory.openApiPath}
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {publicApiDirectory.examples.map((endpoint) => (
            <section className="rounded-2xl border border-sky-100 bg-white p-4" key={endpoint.path}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">{endpoint.label}</p>
              <p className="mt-2 font-mono text-sm font-black text-slate-950">{endpoint.path}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{endpoint.supports}</p>
            </section>
          ))}
        </div>
        <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">Volatility endpoint cache contract</p>
          <p className="mt-2 font-mono text-sm font-black text-slate-950">{publicApiDirectory.volatilityContract.path}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{publicApiDirectory.volatilityContract.cacheContract}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{publicApiDirectory.volatilityContract.etagBehavior}</p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {publicApiDirectory.volatilityContract.inputWindowFields.map((field) => (
              <div className="rounded-xl bg-sky-50 p-3" key={field.name}>
                <p className="font-mono text-xs font-black text-sky-950">{field.name}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{field.meaning}</p>
              </div>
            ))}
          </div>
        </section>
        <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-700 md:grid-cols-3">
          {publicApiDirectory.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-3" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-800">perf(web)</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">API performance readiness</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Hot public API paths now have an injectable Redis cache contract, product search returns cursor pagination envelopes, and production readiness remains fail closed until Redis cache credentials and pgbouncer pooler routing are configured. Long-range analytics are documented as rollups only.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-cyan-900 shadow-sm">{apiPerformanceReadiness.status}</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {apiPerformanceReadiness.requiredRuntime.map((item) => (
            <section className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm" key={item.label}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">{item.label}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{item.evidence}</p>
              <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-950">{item.currentState}</p>
            </section>
          ))}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Hot endpoints</p>
            <div className="mt-3 space-y-3">
              {apiPerformanceReadiness.hotEndpoints.map((endpoint) => (
                <div className="rounded-xl bg-slate-50 p-3" key={endpoint.path}>
                  <p className="font-mono text-sm font-black text-slate-950">{endpoint.path}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{endpoint.coverage} · Redis cache TTL {endpoint.ttlSeconds}s</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Rollups only for long ranges</p>
            <div className="mt-3 space-y-3">
              {apiPerformanceReadiness.rollupTables.map((rollup) => (
                <div className="rounded-xl bg-slate-50 p-3" key={rollup.table}>
                  <p className="font-mono text-sm font-black text-slate-950">{rollup.table}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{rollup.usage}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
              {apiPerformanceReadiness.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-800">perf(db)</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">TimescaleDB evaluation</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              {timescaleDbEvaluation.title} is {timescaleDbEvaluation.status}: {timescaleDbEvaluation.recommendation} The visible contract keeps declarative monthly partitions as the active fallback instead of claiming TimescaleDB adoption without extension, hypertable, compression, and retention evidence.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-fuchsia-900 shadow-sm">{timescaleDbEvaluation.status}</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {timescaleDbEvaluation.evaluationSignals.map((signal) => (
            <section className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm" key={signal.label}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">{signal.label}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{signal.state}</p>
              <p className="mt-3 rounded-xl bg-fuchsia-50 p-3 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-950">{signal.evidence}</p>
            </section>
          ))}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">Fallback tables</p>
            <div className="mt-3 space-y-3">
              {timescaleDbEvaluation.fallbackTables.map((item) => (
                <div className="rounded-xl bg-slate-50 p-3" key={item.table}>
                  <p className="font-mono text-sm font-black text-slate-950">{item.table}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{item.role}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">Retention fallback</p>
            <div className="mt-3 space-y-3">
              {timescaleDbEvaluation.fallbackFunctions.map((item) => (
                <div className="rounded-xl bg-slate-50 p-3" key={item.name}>
                  <p className="font-mono text-sm font-black text-slate-950">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{item.role}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
              {timescaleDbEvaluation.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50/60">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-800">feat(commodity)</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Loose-item ingestion classifier · {commodityIngestionClassifierEvidence.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              No-barcode, sold-by-weight rows now classify as product_kind='commodity' ({commodityIngestionClassifierEvidence.example.productKindColumn}), resolve {commodityIngestionClassifierEvidence.example.commodityId}, and carry unit price, variant, is_organic, and origin_country into the ingestion contract.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-lime-900 shadow-sm">
            {commodityIngestionClassifierEvidence.taxonomyCount} commodities · {commodityIngestionClassifierEvidence.stapleCount} staples
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl border border-lime-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">Example mapped row</p>
            <p className="mt-2 font-black text-slate-950">{commodityIngestionClassifierEvidence.example.rawName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.values(commodityIngestionClassifierEvidence.example).slice(1).map((value) => (
                <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-950" key={value}>
                  {value}
                </span>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-amber-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Confidence guardrail</p>
            <p className="mt-2 text-sm font-bold leading-6 text-amber-950">{commodityIngestionClassifierEvidence.sourceConfidencePolicy}</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
              {commodityIngestionClassifierEvidence.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-800">feat(commodity)</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Commodity mapping curator review · {commodityMappingReviewPlan.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Low-confidence loose-item aliases are routed through human_review_assignments before any shopper-facing commodity coverage changes. Reporter trust is checked in community_reporter_trust, and reviewWritebacks stay limited to approved commodity mapping actions.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-right shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">Status</p>
            <p className="mt-2 text-2xl font-black text-orange-950">{commodityMappingReviewPlan.status}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{commodityMappingReviewPlan.queue.length} queued · {commodityMappingReviewPlan.assignments.length} assigned</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {commodityMappingReviewPlan.queue.map((item) => (
            <section className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm" key={item.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">{item.priority} priority</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{item.subjectType}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.reason}</p>
              <p className="mt-3 rounded-xl bg-orange-50 p-2 text-xs font-bold text-orange-950">{commodityMappingReviewPlan.queueTable} · {item.subjectId}</p>
            </section>
          ))}
          {commodityMappingReviewPlan.reporterControls.map((control) => (
            <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm" key={control.reporterId}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{commodityMappingReviewPlan.trustTable}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{control.reporterId}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{control.action}: {control.reason}</p>
            </section>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">reviewWritebacks</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {commodityMappingReviewPlan.reviewWritebacks.map((writeback) => (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-950" key={writeback}>{writeback}</span>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{commodityMappingReviewPlan.nextRuntimeStep}</p>
          </section>
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">Guardrails</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
              {commodityMappingReviewPlan.guardrails.map((guardrail) => (
                <li key={guardrail}>• {guardrail}</li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Source readiness matrix</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Row share, freshness, caveat, and the primary public route are shown together for each verified source group.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/">
            Back to homepage
          </Link>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {sourceReadinessMatrix.map((source) => (
            <Link
              className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
              href={source.primaryRoute}
              key={source.name}
            >
              <div>
                <p className="font-black text-slate-950">{source.name}</p>
                <p className="text-sm text-slate-600">{source.coverage}</p>
              </div>
              <p className="font-black text-emerald-800">{formatPct(source.rowShare * 100)} of rows</p>
              <p className="text-sm font-semibold text-slate-700">
                {source.rows.toLocaleString('sv-SE')} rows · {source.freshness}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Source route map</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each source group lists the public routes that render its verified rows, keeping provenance tied to the browsing surface.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/compare">
            Open comparisons
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {sourceRouteMap.map((source) => (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={source.name}>
              <p className="font-black text-slate-950">{source.name}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {source.routeCount.toLocaleString('sv-SE')} public routes · {source.freshness}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {source.supportingRoutes.map((route) => (
                  <Link
                    className="rounded-full bg-white px-3 py-1 text-sm font-black text-emerald-900 ring-1 ring-emerald-100"
                    href={route}
                    key={`${source.name}-${route}`}
                  >
                    {route}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Claim boundary ledger</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each source group separates the public claim it can support from claims that remain blocked until a stronger production record exists.
            </p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href="/store-coverage">
            Inspect store coverage
          </Link>
        </div>
        <div className="mt-5 divide-y divide-slate-200">
          {sourceClaimLedger.map((source) => (
            <section className="grid gap-4 py-5 lg:grid-cols-[0.8fr_1fr_1fr]" key={source.name}>
              <div>
                <p className="font-black text-slate-950">{source.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{source.evidence}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">Freshness: {source.freshness}</p>
                <Link className="mt-3 inline-block text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={source.evidenceRoute}>
                  Evidence route
                </Link>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Supported claim</p>
                <p className="mt-2 text-sm leading-6 text-emerald-950">{source.allowedClaim}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Blocked claim</p>
                <p className="mt-2 text-sm leading-6 text-amber-950">{source.blockedClaim}</p>
              </div>
            </section>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-tight">Store brand coverage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            OpenStreetMap rows are grouped by brand so location coverage can be inspected without implying branch-level prices.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {storeBrandLedger.map((brand) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
                href={`/stores/${brand.sampleSlug}`}
                key={brand.brand}
              >
                <div>
                  <p className="font-black text-slate-950">{brand.brand}</p>
                  <p className="text-sm text-slate-600">
                    {brand.districts.toLocaleString('sv-SE')} districts · {brand.formats.join(', ') || 'format not reported'}
                  </p>
                </div>
                <p className="font-black text-emerald-800">{brand.stores.toLocaleString('sv-SE')} stores</p>
                <p className="text-sm font-semibold text-slate-700">{formatPct(brand.addressCoverage * 100)} addressed</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-tight">Category quality signals</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Categories are ranked by verified row depth, observed products, and same-code Willys/Hemkop matches.
          </p>
          <div className="mt-5 divide-y divide-slate-200">
            {categoryQualityMatrix.map((category) => (
              <Link
                className="grid gap-3 py-4 transition hover:bg-emerald-50/70 md:grid-cols-[1fr_auto_auto]"
                href={`/categories/${category.slug}`}
                key={category.slug}
              >
                <div>
                  <p className="font-black text-slate-950">{category.label}</p>
                  <p className="text-sm text-slate-600">
                    {category.observedProducts.toLocaleString('sv-SE')} observed products · latest {category.latestOpenPrice || 'not reported'}
                  </p>
                </div>
                <p className="font-black text-emerald-800">{category.verifiedRows.toLocaleString('sv-SE')} rows</p>
                <p className="text-sm font-semibold text-slate-700">{category.chainMatches.toLocaleString('sv-SE')} matches</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value}</p>
    </Card>
  );
}
