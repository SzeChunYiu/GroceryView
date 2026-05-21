import Link from 'next/link';
import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { products, receiptReviewDesk, receiptReviewQueue, stores } from '@/lib/demo-data';

export const dynamic = 'force-static';

const route = 'scanner';

const confidenceFormatter = new Intl.NumberFormat('sv-SE', {
  maximumFractionDigits: 0,
  style: 'percent'
});

const averageConfidence =
  receiptReviewDesk.reduce((total, receipt) => total + receipt.confidence, 0) /
  receiptReviewDesk.length;

const needsReviewCount = receiptReviewDesk.filter((receipt) => receipt.status === 'Needs review').length;
const readyCount = receiptReviewDesk.filter((receipt) => receipt.status === 'Ready').length;
const matchedCount = receiptReviewDesk.filter((receipt) => receipt.status === 'Matched').length;

const productBySlug = new Map(products.map((product) => [product.slug, product]));
const storeBySlug = new Map(stores.map((store) => [store.slug, store]));

export default function ScannerPage() {
  return (
    <PageShell>
      <Eyebrow>Receipt scanner</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Receipt review desk</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Scanner rows come from the demo receipt-review driver and stay tied to visible product and store records before any savings update is published.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Receipts in desk</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{receiptReviewDesk.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Captured receipts with line-level review notes.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Needs review</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-800">{needsReviewCount}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Held until weighted or promo lines are confirmed.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Ready to publish</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-800">{readyCount + matchedCount}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Ready or matched receipts can support downstream views.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Average confidence</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{confidenceFormatter.format(averageConfidence)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Computed from every receipt-review row.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Review queue</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Line items waiting on scanner confidence</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900">
              {receiptReviewDesk.length} receipts
            </span>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {receiptReviewDesk.map((receipt) => {
              const store = storeBySlug.get(receipt.storeSlug);
              return (
                <article className="grid gap-4 py-5 lg:grid-cols-[1.1fr_0.7fr_auto]" key={receipt.receiptId}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950">{receipt.storeName}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{receipt.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {receipt.receiptId} · {receipt.capturedAt} · owner {receipt.owner}
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{receipt.nextAction}</p>
                    {store ? (
                      <Link className="mt-3 inline-flex text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={`/stores/${store.slug}`}>
                        Open {store.name}
                      </Link>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Flagged lines</p>
                    <div className="mt-3 space-y-3">
                      {receipt.flaggedLines.map((line) => {
                        const product = productBySlug.get(line.productSlug);
                        return (
                          <div key={`${receipt.receiptId}-${line.productSlug}`}>
                            <Link className="font-black text-slate-950 hover:text-emerald-800" href={`/products/${line.productSlug}`}>
                              {product?.name ?? line.productSlug}
                            </Link>
                            <p className="text-sm text-slate-600">{line.label}</p>
                            {product ? <p className="text-xs font-semibold text-slate-500">{product.price} · {product.source}</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-start lg:justify-end">
                    <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Confidence</p>
                      <p className="text-2xl font-black">{confidenceFormatter.format(receipt.confidence)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-300">{receipt.total}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card>
          <Eyebrow>Receipt impact</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Basket updates held by scanner review</h2>
          <div className="mt-5 space-y-3">
            {receiptReviewQueue.map((receipt) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${receipt.receipt}-${receipt.store}`}>
                <p className="font-black text-slate-950">{receipt.receipt}</p>
                <p className="mt-1 text-sm text-slate-600">{receipt.area} · {receipt.items}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-black">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{receipt.confidence}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-900">{receipt.impact}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{receipt.issue}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <NoVerifiedData route={route} title="Receipt scanner still fails closed for private production uploads in this static snapshot" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
