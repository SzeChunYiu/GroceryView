import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { AdminMetricCard, Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { DataGrid, DataGridIssueBadge, DataGridProductCell } from '@/components/data-grid';
import { axfoodProducts } from '@/lib/axfood-products';
import { buildUnitNormalizationQaReport } from '@/lib/normalization';
import { pricedProducts } from '@/lib/openprices-products';
import { routeMetadata } from '@/lib/seo';
import { unitNormalizationQaIssueLabel, unitNormalizationQaSeverityLabel } from '@/lib/unit-normalizer';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/unit-audit',
    title: 'Unit normalization audit | GroceryView',
    description: 'Admin review dashboard for missing package sizes, ambiguous units, and extreme unit prices.',
    noIndex: true
  });
}

function axfoodSourceUrl(product: (typeof axfoodProducts)[number]) {
  return Object.values(product.chains).find((chain) => chain.url)?.url || `/products/${product.slug}`;
}

const auditedProducts = [
  ...axfoodProducts.map((product) => ({
    productId: `axfood:${product.slug}`,
    productName: product.name,
    packageText: product.subline,
    price: product.lowestPrice,
    brand: product.brand,
    imageUrl: product.image,
    sourceUrl: axfoodSourceUrl(product)
  })),
  ...pricedProducts.map((product) => ({
    productId: `openprices:${product.slug}`,
    productName: product.name,
    packageText: product.quantity,
    price: product.priceMedian,
    brand: product.brands,
    imageUrl: product.image,
    sourceUrl: `https://world.openfoodfacts.org/product/${product.code}`
  }))
];

const auditReport = buildUnitNormalizationQaReport(auditedProducts);
const productLookup = new Map(auditedProducts.map((product) => [product.productId, product]));

function severityTone(severity: 'blocker' | 'review' | 'warning') {
  if (severity === 'blocker') return 'danger';
  if (severity === 'review') return 'review';
  return 'warning';
}

export default function UnitAuditAdminPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-800">Unit normalization audit</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Products needing unit correction</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Review ambiguous package units, missing package sizes, and extreme comparable prices before these products influence price comparison or cheapest-per-unit claims.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={auditReport.issueCount > 0 ? 'warning' : 'success'}>{auditReport.issueCount > 0 ? 'Review needed' : 'No issues'}</StatusBadge>
            <StatusBadge>Admin only</StatusBadge>
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Unit normalization audit summary">
          <AdminMetricCard detail="Total QA findings from Axfood and OpenPrices rows." label="Issues" value={auditReport.issueCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Rows without a parseable package unit or size." label="Missing units" value={auditReport.missingUnitCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Parsed package sizes outside grocery guardrails." label="Pack outliers" value={auditReport.suspiciousPackSizeCount.toLocaleString('sv-SE')} />
          <AdminMetricCard detail="Non-positive or implausibly high normalized unit prices." label="Extreme prices" value={auditReport.inconsistentUnitPriceCount.toLocaleString('sv-SE')} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-red-200 bg-red-50">
            <Eyebrow>Outlier buckets</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-red-950">Package size review queues</h2>
            <dl className="mt-5 grid gap-3 text-sm font-semibold text-red-950">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <dt className="font-black uppercase tracking-[0.14em]">Mass</dt>
                <dd className="mt-1 text-2xl font-black">{auditReport.suspiciousPackSizeBuckets.kg.toLocaleString('sv-SE')}</dd>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <dt className="font-black uppercase tracking-[0.14em]">Volume</dt>
                <dd className="mt-1 text-2xl font-black">{auditReport.suspiciousPackSizeBuckets.l.toLocaleString('sv-SE')}</dd>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <dt className="font-black uppercase tracking-[0.14em]">Count</dt>
                <dd className="mt-1 text-2xl font-black">{auditReport.suspiciousPackSizeBuckets.piece.toLocaleString('sv-SE')}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <Eyebrow>Correction queue</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Highest-priority unit findings</h2>
            <DataGrid className="mt-5 overflow-x-auto" dense>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th>Product</th>
                    <th>Issue</th>
                    <th>Package text</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody className="align-top text-slate-700">
                  {auditReport.issues.map((issue) => {
                    const product = productLookup.get(issue.productId);
                    return (
                      <tr key={`${issue.productId}-${issue.kind}`}>
                        <td>
                          <DataGridProductCell
                            brand={product?.brand}
                            imageUrl={product?.imageUrl}
                            name={issue.productName}
                            sourceUrl={product?.sourceUrl}
                            unitLabel={issue.packageText}
                          />
                        </td>
                        <td>
                          <div className="grid gap-2">
                            <DataGridIssueBadge tone={severityTone(issue.severity)}>{unitNormalizationQaSeverityLabel(issue.severity)}</DataGridIssueBadge>
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{unitNormalizationQaIssueLabel(issue.kind)}</span>
                          </div>
                        </td>
                        <td className="font-semibold">{issue.packageText}</td>
                        <td className="max-w-sm leading-6">{issue.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DataGrid>
          </Card>
        </section>

        <Card className="mt-6 border-amber-200 bg-amber-50">
          <Eyebrow>Guardrails</Eyebrow>
          <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-amber-950">
            {auditReport.guardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
          </ul>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
