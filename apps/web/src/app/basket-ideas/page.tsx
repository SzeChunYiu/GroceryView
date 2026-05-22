import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { studentBasicsBoard } from '@/lib/demo-data';
import { basketImportExportContract, basketImportReviewContract, retailerBasketTransferContract, retailerHandoffContract } from '@/lib/verified-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export default function BasketIdeasPage() {
  const { comparison, coverage } = studentBasicsBoard;
  return (
    <PageShell>
      <Eyebrow>Student staples</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Student staples cheapest-basics board</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This persona board calls compareBasketStrategies and summarizeStoreBasketCoverage for a tight student basics basket, showing the cheapest staple rows across chains without inventing missing prices.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Split-shop basics</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{formatSek(comparison.cheapestByProduct.total)}</p>
          <p className="mt-3 font-semibold text-slate-700">for {comparison.cheapestByProduct.assignments.length} student staple rows.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Savings vs one store</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSek(comparison.savingsVsBestSingleStore)}</p>
          <p className="mt-3 font-semibold text-slate-700">Best full-coverage option: {comparison.bestSingleStore?.storeName ?? 'no full-coverage store'}.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage</p>
          <p className="mt-2 text-5xl font-black capitalize text-slate-950">{studentBasicsBoard.confidence.level}</p>
          <p className="mt-3 font-semibold text-slate-700">{studentBasicsBoard.confidence.caveat}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-2xl font-black">Cheapest basics basket</h2>
          <div className="mt-4 space-y-3">
            {studentBasicsBoard.items.map((item) => (
              <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${item.productId}`} key={item.productId}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.quantity} × {formatSek(item.unitPrice)} at {item.storeName}</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-800">{formatSek(item.lineTotal)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-black">Store coverage</h2>
          <div className="mt-4 space-y-3">
            {coverage.stores.map((store) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={store.storeId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{store.storeName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{store.availableProductIds.length} of {store.availableProductIds.length + store.missingProductIds.length} basics covered</p>
                  </div>
                  <p className="text-xl font-black text-slate-950">{formatSek(store.knownTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Basket bridge</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Bookmarklet import/export: {basketImportExportContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The account API accepts consented bookmarklet or browser extension payloads only after explicit shopper consent at <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{basketImportExportContract.endpoint}</code>, with a static bookmarklet asset at <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">{basketImportExportContract.staticAsset}</code>.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketImportExportContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketImportExportContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketImportExportContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Private review queue</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Account-bound import review: {basketImportReviewContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Unmatched retailer rows stay out of the basket until a signed-in shopper accepts a verified GroceryView match through <code className="rounded bg-white/80 px-1 py-0.5 text-cyan-900">{basketImportReviewContract.decisionEndpoint}</code>. The open queue is fetched from <code className="rounded bg-white/80 px-1 py-0.5 text-cyan-900">{basketImportReviewContract.endpoint}</code> and remains account-bound.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketImportReviewContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketImportReviewContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {basketImportReviewContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Retailer action layer</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Retailer handoff support matrix: {retailerHandoffContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The basket action API exposes <code className="rounded bg-white/80 px-1 py-0.5 text-amber-900">{retailerHandoffContract.endpoint}</code> so GroceryView can present honest retailer handoff actions without pretending that unsupported basket transfer or checkout confirmation is available.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerHandoffContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Support matrix</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerHandoffContract.supportedRetailers.map((retailer) => (
                <li key={retailer.retailerId}>{retailer.label}: product links {retailer.productLinks}, basket transfer {retailer.basketTransfer}, checkout confirmation {retailer.checkoutConfirmation}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerHandoffContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-rose-200 bg-rose-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-800">Secure transfer gate</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Secure basket transfer preflight: {retailerBasketTransferContract.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The transfer preflight API <code className="rounded bg-white/80 px-1 py-0.5 text-rose-900">{retailerBasketTransferContract.endpoint}</code> will block unless capability is verified, every line has a retailer product match, and the request carries a signed payload. A transfer attempt is not checkout confirmation, payment, delivery booking, or inventory reservation.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="font-black text-slate-950">Required inputs</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerBasketTransferContract.requiredInputs.map((input) => <li key={input}>{input}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Shipped behavior</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerBasketTransferContract.shippedBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-black text-slate-950">Static snapshot remains closed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {retailerBasketTransferContract.blockedInStaticSnapshot.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
