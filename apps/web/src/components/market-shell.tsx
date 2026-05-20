import Link from 'next/link';
import { BarChart3, MapPin, ScanSearch, ShoppingBasket } from 'lucide-react';
import { categories, householdSavings, products, stockholmAreas, stores, weeklyBasket } from '@/lib/demo-data';

export function MarketShell() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/products/zoegas-coffee-450g">Products</Link>
          <Link href="/stores/willys-odenplan">Stores</Link>
          <Link href="/categories/coffee">Categories</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Stockholm grocery terminal</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Track grocery prices with provenance, confidence, and basket impact.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Product, store, and category routes are ready for live price data without treating unverified observations as
            official shelf prices.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Best current price" value={products[0].price} />
            <Metric label="Coffee index" value={categories[0].index} />
            <Metric label="Basket route state" value="Ready" />
          </div>
        </div>

        <div className="rounded-lg border border-market-ink/10 bg-white p-5">
          <h2 className="text-lg font-black">Price provenance</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <MetadataRow label="Price type" value={products[0].priceType} />
            <MetadataRow label="Confidence" value={products[0].confidence} />
            <MetadataRow label="Observed" value={products[0].observedAt} />
            <MetadataRow label="Source" value={products[0].source} />
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard icon={<BarChart3 size={20} />} title="Product terminal" href="/products/zoegas-coffee-450g">
          Current price, unit price, source timestamp, and confidence labels are first-class page content.
        </FeatureCard>
        <FeatureCard icon={<MapPin size={20} />} title="Store profile" href="/stores/willys-odenplan">
          Store distance is shown only as metadata; it never affects default Deal Score.
        </FeatureCard>
        <FeatureCard icon={<ShoppingBasket size={20} />} title="Basket planner" href="/weekly-basket">
          Weekly basket work can build on the same App Router shell and TanStack Query provider.
        </FeatureCard>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Category market tape</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            Category instruments expose index movement and the current top product signal from the same driver data.
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block text-xs font-bold uppercase text-market-ink/50">{category.name}</span>
              <span className="mt-2 block text-2xl font-black">{category.index}</span>
              <span className="mt-1 block font-semibold text-market-ink/70">
                {category.movement} · {category.topDeal}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Stockholm store tape</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            Store coverage is visible on the homepage and links directly to each store profile.
          </p>
        </div>
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.slug}
              href={`/stores/${store.slug}`}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 sm:border-r"
            >
              <span className="block font-bold">{store.name}</span>
              <span className="mt-1 block text-market-ink/60">
                {store.district} · {store.bestCategory}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Area coverage tape</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            District coverage stays visible so empty areas are clear before live connector data fills in.
          </p>
        </div>
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {stockholmAreas.map((area) => (
            <div key={area.slug} className="border-b border-market-ink/10 px-4 py-4 text-sm sm:border-r">
              <span className="block font-bold">{area.name}</span>
              <span className="mt-1 block text-market-ink/60">{area.storeCount} tracked stores</span>
              <span className="mt-2 block text-xs font-bold uppercase text-market-ink/50">
                Top savings: {area.topSavings}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Product</span>
          <span>Best store</span>
          <span>Unit price</span>
        </div>
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className="grid grid-cols-[1fr_1fr_1fr] px-4 py-4 text-sm hover:bg-market-oat/45"
          >
            <span className="font-bold">{product.ticker}</span>
            <span>{product.store}</span>
            <span>{product.unitPrice}</span>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <h2 className="text-lg font-black">Weekly basket tape</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Household planning rows reuse the same visible product slugs as the price terminal.
            </p>
          </div>
          <LightMetric label="Planned total" value={householdSavings.weeklyTotal} />
          <LightMetric label="Vs last week" value={householdSavings.vsLastWeek} />
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Basket item</span>
          <span>Qty</span>
          <span>Total</span>
          <span>Move</span>
        </div>
        {weeklyBasket.map((item) => {
          const product = products.find((candidate) => candidate.slug === item.slug);

          return (
            <Link
              key={item.slug}
              href={`/products/${item.slug}`}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-4 text-sm hover:bg-market-oat/45"
            >
              <span className="font-bold">{product?.ticker ?? item.slug}</span>
              <span>{item.qty}</span>
              <span>{item.total}</span>
              <span>{item.vsLastWeek}</span>
            </Link>
          );
        })}
      </section>

      <div className="flex items-center gap-2 rounded-lg border border-market-ink/10 bg-white p-4 text-sm text-market-ink/70">
        <ScanSearch size={18} />
        Scanner and receipt review routes can reuse this shell when the scanner placeholder graduates.
      </div>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-white/10 p-3">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs text-white/65">{label}</span>
    </div>
  );
}

function MetadataRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-market-ink/10 pb-2 last:border-0">
      <dt className="font-semibold text-market-ink/55">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

function LightMetric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-3">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs font-semibold text-market-ink/55">{label}</span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  href,
  children
}: Readonly<{ icon: React.ReactNode; title: string; href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className="rounded-lg border border-market-ink/10 bg-white p-4 hover:border-market-mint/70">
      <div className="flex items-center gap-2 font-black">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-sm leading-6 text-market-ink/65">{children}</p>
    </Link>
  );
}
