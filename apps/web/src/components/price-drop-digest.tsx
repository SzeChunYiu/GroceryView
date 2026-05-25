import Link from 'next/link';

export type PriceDropDigestItem = {
  productSlug: string;
  productName: string;
  brand: string;
  category: string;
  currentPriceLabel: string;
  previousPriceLabel: string;
  dropPercentLabel: string;
  savingsLabel: string;
  evidenceLabel: string;
  matchReason: string;
};

export type PriceDropDigestGroup = {
  id: string;
  title: string;
  description: string;
  preferenceSignal: string;
  href: string;
  items: PriceDropDigestItem[];
};

type PriceDropDigestProps = {
  groups: PriceDropDigestGroup[];
  generatedAtLabel: string;
  apiHref?: string;
};

export function PriceDropDigest({ groups, generatedAtLabel, apiHref = '/api/digest' }: PriceDropDigestProps) {
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm" aria-labelledby="price-drop-digest-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Personalized savings digest</p>
          <h2 id="price-drop-digest-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950">Price drops grouped by why they matter to you</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Saved searches, favorites, dietary preferences, and usual stores each get a separate review lane so shoppers can scan relevant verified drops before opening the full deals feed.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-950">
          <p>{totalItems} digest matches</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-emerald-800">Generated {generatedAtLabel}</p>
          <Link className="mt-2 inline-flex text-xs font-black underline decoration-emerald-300 underline-offset-4" href={apiHref}>API payload</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4" key={group.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{group.preferenceSignal}</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{group.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{group.description}</p>
              </div>
              <Link className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={group.href}>Open lane</Link>
            </div>

            <div className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <Link className="rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300" href={`/products/${item.productSlug}`} key={`${group.id}-${item.productSlug}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{item.category}</p>
                      <h4 className="mt-1 text-base font-black leading-6 text-slate-950">{item.productName}</h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{item.brand}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                      <p className="text-xs font-black text-emerald-700">{item.dropPercentLabel}</p>
                      <p className="text-lg font-black text-emerald-950">{item.currentPriceLabel}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-black text-emerald-800">Save {item.savingsLabel} vs {item.previousPriceLabel}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{item.matchReason}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.evidenceLabel}</p>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
