import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { axfoodProducts } from '@/lib/axfood-products';
import { buildDuplicateReconcileWorkflow, titleSignatureForProduct, type DuplicateReviewGroup, type ProductRecord } from '@/lib/deduplicate-products';
import { pricedProducts } from '@/lib/openprices-products';
import { routeMetadata } from '@/lib/seo';

const reviewProducts: ProductRecord[] = [
  ...axfoodProducts.slice(0, 220).map((product) => ({
    id: `axfood:${product.code}`,
    name: product.name,
    brand: product.brand,
    barcode: product.code,
    category: product.category,
    imageUrl: product.image,
    size: product.subline,
    unit: Object.values(product.chains)[0]?.priceUnit,
    ean: product.code
  })),
  ...pricedProducts.slice(0, 240).map((product) => ({
    id: `openprices:${product.code}`,
    name: product.name,
    brand: product.brands,
    barcode: product.code,
    category: product.category,
    imageUrl: product.image,
    size: product.quantity,
    ean: product.code
  }))
];

const workflow = buildDuplicateReconcileWorkflow(reviewProducts, 0.65);
const visibleGroups = workflow.groups.slice(0, 12);
const auditPreview = workflow.auditLog.slice(0, 5);

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/duplicates',
    title: 'Duplicate product reconciliation | GroceryView',
    description: 'Admin workflow for reconciling duplicate grocery products by barcode, brand, title signature, package size, and unit evidence.',
    noIndex: true
  });
}

function mergeActionLabel(action: DuplicateReviewGroup['recommendedAction']) {
  if (action === 'merge') return 'Ready to merge';
  if (action === 'confidence') return 'Needs confidence check';
  return 'Keep separate candidate';
}

function ProductEvidenceCard({ product }: Readonly<{ product: ProductRecord }>) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{product.id}</p>
      <h3 className="mt-1 text-base font-black text-slate-950">{product.name}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
        <div><dt className="text-slate-500">Brand</dt><dd>{product.brand || '-'}</dd></div>
        <div><dt className="text-slate-500">Barcode</dt><dd>{product.barcode || product.ean || product.upc || '-'}</dd></div>
        <div><dt className="text-slate-500">Size</dt><dd>{product.size || '-'}</dd></div>
        <div><dt className="text-slate-500">Category</dt><dd>{product.category || '-'}</dd></div>
      </dl>
      <p className="mt-3 rounded bg-white px-2 py-1 text-xs font-bold text-slate-600">
        Title signature: {titleSignatureForProduct(product) || 'missing'}
      </p>
    </div>
  );
}

export default function DuplicateReviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Admin reconciliation</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Duplicate product reconciliation</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Server-side matching groups duplicate candidates by barcode, brand, normalized title signature, package size, and unit evidence before any merge is approved.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Duplicate reconciliation summary">
          <div className="rounded-lg border border-emerald-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Input products</p>
            <p className="mt-2 text-3xl font-black">{workflow.stats.inputProductCount}</p>
          </div>
          <div className="rounded-lg border border-sky-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wide text-sky-800">Review groups</p>
            <p className="mt-2 text-3xl font-black">{workflow.stats.reviewGroupCount}</p>
          </div>
          <div className="rounded-lg border border-violet-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wide text-violet-800">Ready to merge</p>
            <p className="mt-2 text-3xl font-black">{workflow.stats.readyToMergeCount}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wide text-amber-800">Needs confidence</p>
            <p className="mt-2 text-3xl font-black">{workflow.stats.needsConfidenceCount}</p>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5" aria-label="Reconcile guardrails">
          <h2 className="text-lg font-black text-slate-950">Reconcile workflow guardrails</h2>
          <ul className="mt-3 grid gap-2 text-sm font-semibold text-slate-700 md:grid-cols-3">
            {workflow.guardrails.map((guardrail) => <li className="rounded bg-slate-50 p-3" key={guardrail}>{guardrail}</li>)}
          </ul>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]" aria-label="Duplicate decision audit">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-slate-950">Admin decision actions</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Reviewers can merge, reject, alias, or undo candidate groups. Every decision records the canonical product id, target ids, actor, timestamp, and note before any public ticker alias is applied.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {['merge', 'reject', 'alias', 'undo'].map((action) => (
                <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-slate-700" key={action}>{action}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-black text-emerald-950">Public ticker protection</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
              {Object.keys(workflow.publicTickerAliasMap).length.toLocaleString('sv-SE')} duplicate ids are mapped to canonical ids for public ticker surfaces while review remains reversible.
            </p>
          </div>
        </section>

        <section className="mt-6 space-y-5" aria-label="Duplicate product candidate groups">
          {visibleGroups.map((group) => {
            const topCandidate = group.candidates[0];
            const canonical = workflow.mergeQueue.find((item) => item.id === group.id)?.canonicalProduct;
            const confidence = topCandidate ? Math.round(topCandidate.confidence * 100) : 0;

            return (
              <article className="rounded-lg border border-slate-200 bg-white p-5" key={group.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                      {mergeActionLabel(group.recommendedAction)} · {confidence}% confidence
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{group.products[0]?.name ?? 'Duplicate candidate group'}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Signals: {group.signals.join(', ') || 'normalized product attributes'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
                    <p>Barcode: {group.matchKey.ean || 'not shared'}</p>
                    <p>Brand key: {group.matchKey.normalizedBrand || 'missing'}</p>
                    <p>Size/unit: {[group.matchKey.normalizedSize, group.matchKey.normalizedUnit].filter(Boolean).join(' ') || 'missing'}</p>
                    {canonical ? <p>Canonical: {canonical.id}</p> : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {group.products.map((product) => <ProductEvidenceCard key={product.id} product={product} />)}
                </div>

                <div className="mt-5 flex flex-wrap gap-3" aria-label="Human reconcile controls">
                  <button className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" type="button">Merge</button>
                  <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" type="button">Reject</button>
                  <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" type="button">Alias</button>
                  <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" type="button">Undo</button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5" aria-label="Duplicate review audit log">
          <h2 className="text-lg font-black text-slate-950">Audit log preview</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">Canonical</th>
                  <th className="px-3 py-2">Targets</th>
                  <th className="px-3 py-2">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditPreview.map((entry) => (
                  <tr key={`${entry.groupId}-${entry.recordedAt}`}>
                    <td className="px-3 py-3 font-black text-slate-950">{entry.action}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.groupId}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.canonicalProductId}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.targetProductIds.length}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.recordedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
