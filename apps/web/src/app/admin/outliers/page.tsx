import Link from 'next/link';

type Outlier = {
  id: string;
  name: string;
  currentPrice: number;
  productUrl: string;
  screenshotPath?: string | null;
};

const SAMPLE_OUTLIERS: Outlier[] = [
  {
    id: 'willys-mocha-coffee',
    name: 'High-value coffee blend',
    currentPrice: 349.9,
    productUrl: 'https://example.com/product/willys-mocha-coffee'
  },
  {
    id: 'ica-olive-oil',
    name: 'Bulk olive oil 3L',
    currentPrice: 799,
    productUrl: 'https://example.com/product/ica-olive-oil'
  }
];

export default function OutliersPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="text-sm font-semibold text-zinc-700">Admin · Outliers</div>
      </nav>

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Verification console</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Outlier screenshot verification</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600">
          For selected high-value price outliers, capture product page screenshots so admins can visually verify
          scraper accuracy before publishing adjustments.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-zinc-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
          <span>Product</span>
          <span className="text-right">Observed price</span>
          <span>Verification</span>
        </div>
        {SAMPLE_OUTLIERS.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 border-b border-zinc-100 px-4 py-4 text-sm"
          >
            <div>
              <p className="font-semibold text-zinc-950">{item.name}</p>
              <a href={item.productUrl} className="text-xs text-zinc-500 hover:underline">
                open source link
              </a>
            </div>
            <p className="text-right font-semibold text-zinc-800">{item.currentPrice.toFixed(2)} SEK</p>
            <p className="text-zinc-600">
              {item.screenshotPath ? `Verified (${item.screenshotPath})` : 'Pending screenshot capture'}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}

