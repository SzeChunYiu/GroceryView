import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { axfoodProducts } from '@/lib/axfood-products';
import { buildDuplicateReviewGroups, type ProductRecord } from '@/lib/deduplicate-products';
import { pricedProducts } from '@/lib/openprices-products';
import { routeMetadata } from '@/lib/seo';

const reviewProducts: ProductRecord[] = [
  ...axfoodProducts.slice(0, 140).map((product) => ({
    id: `axfood:${product.code}`,
    name: product.name,
    brand: product.brand,
    category: product.category,
    size: product.subline,
    ean: product.code
  })),
  ...pricedProducts.slice(0, 160).map((product) => ({
    id: `openprices:${product.code}`,
    name: product.name,
    brand: product.brands,
    category: product.category,
    size: product.quantity,
    ean: product.code
  }))
];

const duplicateGroups = buildDuplicateReviewGroups(reviewProducts, 0.65).slice(0, 10);
const pendingMergeCount = duplicateGroups.filter((group) => group.recommendedAction === 'merge').length;
const reviewedProductCount = new Set(duplicateGroups.flatMap((group) => group.products.map((product) => product.id))).size;

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/deduplication',
    title: 'Duplicate product merge review | GroceryView',
    description: 'Human review workflow for likely duplicate grocery products grouped by EAN, normalized name, brand, package size, and unit.',
    noIndex: true
  });
}

function mergeActionLabel(action: (typeof duplicateGroups)[number]['recommendedAction']) {
  if (action === 'merge') return 'Ready to merge';
  if (action === 'confidence') return 'Needs confidence check';
  return 'Keep separate candidate';
}

export default function AdminDeduplicationPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-800">Admin deduplication</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Duplicate product merge review</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Likely duplicate products are grouped for human decisions using EAN matches plus normalized name, brand, package size, and unit evidence before any catalogue merge is accepted.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Deduplication review summary">
          <div className="rounded-[1.5rem] border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Review groups</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{duplicateGroups.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Ready to merge</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{pendingMergeCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">Products in queue</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{reviewedProductCount}</p>
          </div>
        </section>

        <section className="mt-6 space-y-5" aria-label="Duplicate product merge candidates">
          {duplicateGroups.map((group) => {
            const topCandidate = group.candidates[0];
            const confidence = topCandidate ? Math.round(topCandidate.confidence * 100) : 0;
            return (
              <article className="rounded-[1.75rem] border border-violet-200 bg-white p-5 shadow-sm" key={group.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">
                      {mergeActionLabel(group.recommendedAction)} · {confidence}% confidence
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{group.products[0]?.name ?? 'Duplicate candidate group'}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Signals: {group.signals.join(', ') || 'normalized product attributes'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-4 text-sm font-bold leading-6 text-violet-950">
                    <p>EAN: {group.matchKey.ean || 'not shared'}</p>
                    <p>Brand key: {group.matchKey.normalizedBrand || 'missing'}</p>
                    <p>Size/unit: {[group.matchKey.normalizedSize, group.matchKey.normalizedUnit].filter(Boolean).join(' ') || 'missing'}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {group.products.map((product) => (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={product.id}>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{product.id}</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                        <div><dt className="text-slate-500">Brand</dt><dd>{product.brand || '—'}</dd></div>
                        <div><dt className="text-slate-500">EAN</dt><dd>{product.ean || product.upc || '—'}</dd></div>
                        <div><dt className="text-slate-500">Size</dt><dd>{product.size || '—'}</dd></div>
                        <div><dt className="text-slate-500">Category</dt><dd>{product.category || '—'}</dd></div>
                      </dl>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3" aria-label="Human merge decision controls">
                  <button className="rounded-full bg-violet-800 px-5 py-3 text-sm font-black text-white" type="button">Approve merge</button>
                  <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" type="button">Keep separate</button>
                  <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" type="button">Request data check</button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
