'use client';

export type StoreLocatorStore = {
  id: string;
  name: string;
  distance: string;
  href: string;
};

const defaultStores: StoreLocatorStore[] = [
  {
    id: 'ica-nara-sodermalm',
    name: 'ICA Nära Södermalm',
    distance: '0.8 km away',
    href: '/stores/ica-nara-sodermalm',
  },
  {
    id: 'coop-odenplan',
    name: 'Coop Odenplan',
    distance: '1.4 km away',
    href: '/stores/coop-odenplan',
  },
];

export function StoreLocator({ stores = defaultStores }: { stores?: StoreLocatorStore[] }) {
  return (
    <section aria-labelledby="store-locator-heading" className="space-y-4">
      <div>
        <h2 id="store-locator-heading" className="text-lg font-semibold text-slate-950">
          Store locator
        </h2>
        <p className="text-sm text-slate-600">Find nearby stores and choose a preferred branch.</p>
      </div>

      <form aria-label="Store locator filters" className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Search stores
          <input
            aria-label="Search stores"
            className="rounded-md border border-slate-300 px-3 py-2"
            name="store-search"
            placeholder="Store name or area"
            type="search"
          />
        </label>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium" type="button">
          Use current location
        </button>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Sort stores
          <select aria-label="Sort stores" className="rounded-md border border-slate-300 px-3 py-2" name="store-sort">
            <option>Nearest first</option>
            <option>Alphabetical</option>
          </select>
        </label>
      </form>

      <ul className="grid gap-3">
        {stores.map((store) => (
          <li className="rounded-lg border border-slate-200 p-3" key={store.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <a className="font-medium text-blue-700 underline" href={store.href}>
                  {store.name}
                </a>
                <p className="text-sm text-slate-600">{store.distance}</p>
              </div>
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="button">
                Set {store.name} as preferred
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
