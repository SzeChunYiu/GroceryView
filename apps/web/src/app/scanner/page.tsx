import Link from "next/link";
import { Camera, CheckCircle2, CircleAlert, MapPin, ScanLine, Store, type LucideIcon } from "lucide-react";
import { scannerQueue } from "@/components/sample-data";
import { products, stores } from "@/lib/demo-data";

export const dynamic = 'force-static';

const matchCandidates = products.slice(0, 6);
const routingStores = stores.slice(0, 4);
const reviewRows = scannerQueue.filter((row) => row.status !== 'Matched');
const matchedRows = scannerQueue.filter((row) => row.status === 'Matched');
const averageConfidence = Math.round(
  scannerQueue.reduce((sum, row) => sum + row.confidence, 0) / scannerQueue.length
);

export default function ScannerPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/products">Products</Link>
          <Link href="/stores">Stores</Link>
          <Link href="/weekly-basket">Basket</Link>
        </div>
      </nav>

      <header className="mb-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Receipt scanner</div>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
            {scannerQueue.length} scan jobs matched against real grocery rows.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
            Scanner review connects receipt and barcode evidence to observed products and Stockholm store profiles.
            Low-confidence rows stay visible until a shopper confirms the source.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <ScannerStat icon={Camera} label="Captured" value={String(scannerQueue.length)} detail="receipt and barcode rows" />
          <ScannerStat icon={CheckCircle2} label="Matched" value={String(matchedRows.length)} detail="ready for price history" />
          <ScannerStat icon={CircleAlert} label="Review" value={String(reviewRows.length)} detail={`${averageConfidence}% avg confidence`} />
        </section>
      </header>

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-market-ink/10 bg-market-ink p-5 text-white">
          <ScanLine className="h-7 w-7 text-market-mint" aria-hidden="true" />
          <h2 className="mt-6 text-2xl font-black">Capture desk</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Scanner intake is tied to current product and store evidence, so each scan can be audited before it becomes
            a household price observation.
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            {routingStores.map((store) => (
              <div key={store.slug} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <dt className="font-black">{store.name}</dt>
                <dd className="mt-1 text-white/65">{store.format} / {store.district}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-market-ink/10 bg-white">
          <div className="hidden grid-cols-[1fr_0.7fr_0.45fr_0.65fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
            <span>Scan job</span>
            <span>Status</span>
            <span>Score</span>
            <span>Reviewer</span>
          </div>
          <ul className="divide-y divide-market-ink/5">
            {scannerQueue.map((row) => (
              <li key={row.item} className="grid gap-3 px-4 py-4 text-sm hover:bg-market-oat/40 md:grid-cols-[1fr_0.7fr_0.45fr_0.65fr]">
                <div>
                  <p className="font-black text-market-ink">{row.item}</p>
                  <p className="mt-1 text-market-ink/55">Owned by {row.owner}</p>
                </div>
                <span className="font-semibold text-market-ink/70">{row.status}</span>
                <span className={row.confidence >= 90 ? 'font-black tabular-nums text-market-mint' : 'font-black tabular-nums text-amber-700'}>
                  {row.confidence}%
                </span>
                <span className="font-semibold text-market-ink/65">{row.owner}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-market-ink/10 bg-white">
          <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid-cols-[1fr_0.55fr_0.5fr_0.5fr]">
            <span>Matched product</span>
            <span>Store</span>
            <span>Price</span>
            <span>Confidence</span>
          </div>
          <ul className="divide-y divide-market-ink/5">
            {matchCandidates.map((product) => (
              <li key={product.slug}>
                <Link
                  className="grid gap-3 px-4 py-3 text-sm hover:bg-market-oat/40 md:grid-cols-[1fr_0.55fr_0.5fr_0.5fr]"
                  href={`/products/${product.slug}`}
                >
                  <span>
                    <span className="block truncate font-semibold text-market-ink">{product.name}</span>
                    <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-market-ink/45">{product.ticker}</span>
                  </span>
                  <span className="truncate text-market-ink/65">{product.store}</span>
                  <span className="font-bold tabular-nums text-market-ink">{product.price}</span>
                  <span className="capitalize text-market-ink/65">{product.confidence}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-market-ink/10 bg-white">
          <div className="border-b border-market-ink/10 px-4 py-4">
            <Store className="h-5 w-5 text-market-mint" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-black text-market-ink">Capture routing</h2>
            <p className="mt-2 text-sm leading-6 text-market-ink/60">
              Scanner review assigns receipt lines to the same Stockholm store profiles used by product and store pages.
            </p>
          </div>
          <ul className="divide-y divide-market-ink/5">
            {routingStores.map((store) => (
              <li key={store.slug}>
                <Link
                  className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 text-sm hover:bg-market-oat/40"
                  href={`/stores/${store.slug}`}
                >
                  <span>
                    <span className="block font-semibold text-market-ink">{store.name}</span>
                    <span className="mt-1 block text-market-ink/55">{store.format}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-market-ink/45">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {store.district}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function ScannerStat({
  icon: Icon,
  label,
  value,
  detail
}: Readonly<{ icon: LucideIcon; label: string; value: string; detail: string }>) {
  return (
    <article className="rounded-lg border border-market-ink/10 bg-white p-4">
      <Icon className="h-5 w-5 text-market-mint" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-market-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-market-ink">{value}</p>
      <p className="mt-1 text-xs text-market-ink/45">{detail}</p>
    </article>
  );
}
