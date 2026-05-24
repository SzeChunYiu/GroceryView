export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-slate-950">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">GroceryView legal</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
        These placeholder terms describe use of GroceryView while the project prepares a full legal review. GroceryView helps shoppers compare grocery information from public and partner data sources such as Axfood, OpenPrices, OpenFoodFacts, and OpenStreetMap-derived store data.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-black">Use of the service</h2>
        <p className="text-sm leading-7 text-slate-700">
          Use GroceryView for personal grocery planning and comparison. Do not misuse the service, interfere with availability, or present GroceryView data as official store, brand, or regulatory guidance.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-black">Data and prices</h2>
        <p className="text-sm leading-7 text-slate-700">
          GroceryView shows sourced grocery observations and may be incomplete, delayed, or unavailable. Confirm final price, availability, and product details with the retailer before purchase.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-black">No warranty</h2>
        <p className="text-sm leading-7 text-slate-700">
          GroceryView is provided as-is as a project placeholder. The team does not promise uninterrupted access, error-free data, or fitness for a particular purpose.
        </p>
      </section>
    </main>
  );
}
