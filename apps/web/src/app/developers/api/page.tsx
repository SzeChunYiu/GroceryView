import { publicApiCatalog, publicApiDisclaimers, publicApiRateLimit, publicApiSmokeExamples, publicApiVersion } from '@/lib/public-api';

const examples = publicApiSmokeExamples();

export default function DevelopersApiPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Public data API</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">GroceryView price + nutrition API</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
        Developers and journalists can fetch observed product, price, history, nutrition, allergen, store, and comparison rows without scraping the web app.
      </p>
      <p className="sr-only">products current-prices price-history nutrition allergens-labels stores comparisons</p>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Get an API key</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Keys require contact, purpose, and terms acceptance. Local smoke tests may use <code>gv_public_demo</code>.</p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-emerald-100">{`curl -X POST /api/public/keys \\\n  -H 'content-type: application/json' \\\n  -d '${JSON.stringify(examples.issueKey.body)}'`}</pre>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Read endpoints</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Base path: <code>/api/public/v1</code>. Add <code>resource</code> and optional <code>limit</code> up to 100.</p>
        <p className="mt-2 text-xs font-bold text-slate-500">Resources: products, current-prices, price-history, nutrition, allergens-labels, stores, comparisons.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {publicApiCatalog().map((resource) => (
            <a className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-950 hover:border-emerald-400" href={resource.href} key={resource.resource}>
              {resource.resource}
              <span className="mt-1 block text-xs font-semibold text-emerald-800">{resource.href}</span>
            </a>
          ))}
        </div>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-emerald-100">{`curl '${examples.readProducts.path}' \\\n  -H '${examples.readProducts.header}'`}</pre>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-black text-amber-950">Rate limits</h2>
          <p className="mt-2 text-sm font-semibold text-amber-900">{publicApiRateLimit.policy}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">Version {publicApiVersion}</p>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <h2 className="text-lg font-black text-rose-950">Terms + disclaimers</h2>
          <ul className="mt-2 space-y-2 text-sm font-semibold text-rose-900">
            {publicApiDisclaimers.map((term) => <li key={term}>{term}</li>)}
          </ul>
        </div>
      </section>
    </main>
  );
}
