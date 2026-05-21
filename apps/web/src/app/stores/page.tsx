import Link from 'next/link';
import { osmStores } from '@/lib/osm-stores';
import { stores as curatedStores } from '@/lib/demo-data';
import { overpassSource } from '@/lib/ingested/overpass';

export const dynamic = 'force-static';

function brandSlug(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/å|ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function StoresIndexPage() {
  const byBrand = new Map<string, typeof osmStores>();
  for (const s of osmStores) {
    const key = s.brand || 'Other';
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key)!.push(s);
  }
  const ordered = [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/map" className="text-market-mint">Map</Link>
          <Link href="/products/zoegas-coffee-450g">Products</Link>
          <Link href="/categories/coffee">Categories</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Stockholm grocery map</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          {osmStores.length.toLocaleString()} stores across Stockholm county.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Coverage backed by © OpenStreetMap contributors (retrieved {osmStores[0]?.retrievedDate}).
          Grouped by chain. Click a store to see its profile and the price observations our connectors collect there.
        </p>
        <p className="mt-2 text-sm font-semibold text-market-ink/55">
          Overpass connector sample: {overpassSource.rowCount} live OSM rows retrieved {overpassSource.retrievedAt.slice(0, 10)}.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ordered.map(([brand, items]) => (
          <Link
            key={brand}
            href={`/stores?brand=${brandSlug(brand)}`}
            className="rounded-lg border border-market-ink/10 bg-white p-4 hover:border-market-mint/70"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-black">{brand}</span>
              <span className="text-sm font-bold text-market-mint">{items.length}</span>
            </div>
            <p className="mt-1 text-xs text-market-ink/55">{items[0]?.format ?? 'store'}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          All stores ({osmStores.length.toLocaleString()})
        </div>
        <ul className="divide-y divide-market-ink/5">
          {osmStores.map((s) => (
            <li key={s.slug} className="grid grid-cols-[1.4fr_1fr_1fr_0.6fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <span className="font-semibold">{s.name}</span>
              <span className="text-market-ink/65">{s.brand}</span>
              <span className="truncate text-market-ink/55">{s.address || s.district}</span>
              <span className="text-right text-xs text-market-ink/45">{s.format}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs text-market-ink/45">
        Curated profile pages exist for {curatedStores.length} stores. The rest list here; their profile routes
        will populate as ingestion connectors land price observations.
      </p>
    </main>
  );
}
