import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import {
  categoryQualityMatrix,
  commodityIngestionClassifierEvidence,
  commodityMappingReviewPlan,
  formatPct,
  multiVerticalDomainFoundation,
  publicApiDirectory,
  snapshot,
  sourceClaimLedger,
  sourceCoverage,
  sourceReadinessMatrix,
  sourceRouteMap,
  storeBrandLedger
} from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

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
        <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-700 md:grid-cols-3">
          {publicApiDirectory.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-3" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
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
