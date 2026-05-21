import Link from 'next/link';
import { BarChart3, Database, MapPin, ScanSearch, ShoppingBasket, Store, UserRound } from 'lucide-react';
import {
  accountProfile,
  basketSubstitutionRadar,
  categories,
  categoryDealLeaders,
  couponStackPlanner,
  dealOpportunityRail,
  householdSavings,
  mealBasketIdeas,
  mealPlanner,
  nutritionValueBoard,
  pantryPlanner,
  personalGroceryInflation,
  priceReportCenter,
  priceReportDigest,
  products,
  receiptReviewQueue,
  receiptReviewDesk,
  savingsPlaybook,
  savingsDashboard,
  shoppingTripSwitchboard,
  sourceCoverage,
  stockholmAreas,
  storeComparisonBoard,
  stores,
  unitPriceAlertDesk,
  weeklyBasket
} from '@/lib/demo-data';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { osmStores } from '@/lib/osm-stores';

const totalObservedPrices = pricedProducts.reduce((sum, product) => sum + product.observationCount, 0);
const latestPriceDate = pricedProducts.reduce(
  (latest, product) => (product.lastObservedAt > latest ? product.lastObservedAt : latest),
  pricedProducts[0]?.lastObservedAt ?? 'n/a'
);
const activeOpenPriceCategories = new Set(pricedProducts.map((product) => product.category || 'pantry')).size;
const activeStoreBrands = new Set(osmStores.map((store) => store.brand || 'Other')).size;
const openPriceLeaders = pricedProducts.slice(0, 6);

function formatSek(value: number) {
  return `SEK ${value.toFixed(2)}`;
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

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
          <Link href="/chain-index">Index</Link>
          <Link href="/compare">Compare</Link>
          <Link href="/watchlist">Watchlist</Link>
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

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={<BarChart3 size={20} />} title="Product terminal" href="/products/zoegas-coffee-450g">
          Current price, unit price, source timestamp, and confidence labels are first-class page content.
        </FeatureCard>
        <FeatureCard icon={<MapPin size={20} />} title="Store profile" href="/stores/willys-odenplan">
          Store distance is shown only as metadata; it never affects default Deal Score.
        </FeatureCard>
        <FeatureCard icon={<ShoppingBasket size={20} />} title="Basket planner" href="/weekly-basket">
          Weekly basket work can build on the same App Router shell and TanStack Query provider.
        </FeatureCard>
        <FeatureCard icon={<UserRound size={20} />} title="Profile hub" href="/account/profile">
          Profile preferences connect saved baskets, privacy choices, and the shopper's home store.
        </FeatureCard>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Profile readiness</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Shopper preferences now have a dedicated route linked to baskets, stores, and privacy settings.
            </p>
          </div>
          <LightMetric label="Complete" value={accountProfile.profileCompleteness} />
          <LightMetric label="Home" value={accountProfile.homeDistrict} />
          <Link
            href="/account/profile"
            className="rounded-md bg-market-ink px-3 py-2 text-center text-sm font-black text-white hover:bg-market-mint hover:text-market-ink"
          >
            Open
          </Link>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {accountProfile.routeLinks.map((route) => (
            <Link
              key={route.label}
              href={route.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block font-black">{route.label}</span>
              <span className="mt-2 block text-market-ink/60">{route.detail}</span>
            </Link>
          ))}
        </div>
      </section>


      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Personal grocery inflation</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Weekly basket inflation is calculated from visible basket quantities, item totals, and week-over-week rows.
            </p>
          </div>
          <LightMetric label="Basket CPI" value={`${personalGroceryInflation.inflationPercent.toFixed(1)}%`} />
          <LightMetric label="Change" value={formatSek(personalGroceryInflation.changeAmount)} />
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {personalGroceryInflation.categoryContributions.slice(0, 6).map((category) => (
            <div key={category.category} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <span className="block font-black">{category.category}</span>
              <span className="mt-2 block text-market-ink/60">Base spend {formatSek(category.spend)}</span>
              <span className={category.changePercent > 0 ? 'mt-3 block font-bold text-market-tomato' : 'mt-3 block font-bold text-market-mint'}>
                {category.changePercent.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Savings dashboard</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Month-to-date savings, watchpoints, and district drivers now have a dedicated route.
            </p>
          </div>
          <LightMetric label="Avoided" value={savingsDashboard.monthToDate.avoidedSpend} />
          <LightMetric label="Baskets" value={String(savingsDashboard.monthToDate.basketCount)} />
          <Link
            href="/savings-dashboard"
            className="rounded-md bg-market-ink px-3 py-2 text-center text-sm font-black text-white hover:bg-market-mint hover:text-market-ink"
          >
            Open
          </Link>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {savingsDashboard.watchpoints.map((point) => (
            <Link
              key={point.label}
              href={point.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block text-xs font-bold uppercase text-market-ink/50">{point.label}</span>
              <span className="mt-2 block font-black">{point.product}</span>
              <span className="mt-1 block text-market-ink/60">{point.store}</span>
              <span className="mt-3 block font-bold text-market-mint">{point.signal}</span>
            </Link>
          ))}
        </div>
      </section>


      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Category deal leaders</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Each category highlights one high-confidence product picked by the core category leader summarizer.
            </p>
          </div>
          <LightMetric label="Categories" value={String(categoryDealLeaders.length)} />
        </div>
        <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
          {categoryDealLeaders.map((leader) => (
            <Link
              key={leader.category}
              href={`/products/${leader.productId}`}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <span className="block text-xs font-bold uppercase text-market-ink/50">{leader.category}</span>
              <span className="mt-1 block font-black">{leader.productName}</span>
              <span className="mt-2 block text-market-ink/60">{leader.storeName}</span>
              <span className="mt-3 block font-bold text-market-mint">{leader.signal}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Deal opportunity rail</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Ranked homepage signals combine Deal Score, discount depth, confidence, and shopper-ready verdicts.
            </p>
          </div>
          <LightMetric label="Top score" value={String(dealOpportunityRail[0]?.dealScore ?? 'n/a')} />
          <LightMetric label="Top drop" value={formatSek(dealOpportunityRail[0]?.priceDrop ?? 0)} />
        </div>
        <div className="hidden grid-cols-[0.9fr_1.4fr_0.7fr_0.8fr_0.8fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
          <span>Verdict</span>
          <span>Opportunity</span>
          <span>Score</span>
          <span>Discount</span>
          <span className="text-right">Confidence</span>
        </div>
        {dealOpportunityRail.map((deal) => (
          <div
            key={`${deal.productId}-${deal.storeId}`}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[0.9fr_1.4fr_0.7fr_0.8fr_0.8fr]"
          >
            <div>
              <span className="inline-flex rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black uppercase text-market-ink/70">
                {deal.band.verdict}
              </span>
              <span className="mt-2 block text-xs font-bold text-market-ink/50">{deal.band.label}</span>
            </div>
            <div className="min-w-0">
              <Link href={`/products/${deal.productId}`} className="block truncate font-black hover:text-market-mint">
                {deal.productName}
              </Link>
              <Link href={`/stores/${deal.storeId}`} className="mt-1 block truncate text-xs font-bold text-market-ink/55">
                {deal.storeName}
              </Link>
              <p className="mt-2 leading-5 text-market-ink/65">{deal.reason}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Score</span>
              <span className="block text-2xl font-black tabular-nums">{deal.dealScore}</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Discount</span>
              <span className="block font-black tabular-nums">{deal.discountPercent.toFixed(1)}%</span>
              <span className="mt-1 block text-xs font-semibold text-market-ink/55">
                {formatSek(deal.priceDrop)} drop
              </span>
            </div>
            <div className="md:text-right">
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Confidence</span>
              <span className="block font-black tabular-nums">{formatConfidence(deal.sourceConfidence)}</span>
              <span className="mt-1 block text-xs font-semibold text-market-ink/55">
                {formatSek(deal.currentPrice)}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Price report digest</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Report-ready summaries turn the highest-signal price rows into shopper-facing route evidence.
            </p>
          </div>
          <LightMetric label="Reports" value={String(priceReportDigest.length)} />
        </div>
        <div className="grid gap-0 lg:grid-cols-3">
          {priceReportDigest.map((report) => (
            <Link
              key={report.title}
              href={report.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 lg:border-r"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{report.scope}</span>
                  <span className="mt-1 block font-black">{report.title}</span>
                </div>
                <span className="shrink-0 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                  {report.metric}
                </span>
              </div>
              <p className="mt-3 font-bold text-market-ink/70">{report.anchor}</p>
              <p className="mt-2 leading-6 text-market-ink/65">{report.summary}</p>
              <p className="mt-3 text-xs font-bold uppercase text-market-ink/45">
                {report.confidence} confidence
              </p>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-market-ink/10 px-4 py-3 text-sm">
          <span className="font-bold text-market-ink/65">
            {priceReportCenter.title}: {priceReportCenter.headline}
          </span>
          <Link
            href="/price-reports"
            className="rounded-md bg-market-ink px-3 py-2 font-black text-white hover:bg-market-mint hover:text-market-ink"
          >
            Open reports
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Basket substitution radar</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Driver rows flag swaps, holds, and compare checks before a planned basket becomes a store trip.
            </p>
          </div>
          <LightMetric label="Signals" value={String(basketSubstitutionRadar.length)} />
          <LightMetric
            label="Highest confidence"
            value={formatConfidence(Math.max(...basketSubstitutionRadar.map((item) => item.sourceConfidence)))}
          />
        </div>
        <div className="hidden grid-cols-[0.6fr_1fr_1fr_0.8fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
          <span>Verdict</span>
          <span>Watch item</span>
          <span>Suggested check</span>
          <span className="text-right">Impact</span>
        </div>
        {basketSubstitutionRadar.map((signal) => (
          <div
            key={`${signal.anchorSlug}-${signal.substituteSlug}`}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[0.6fr_1fr_1fr_0.8fr]"
          >
            <div>
              <span className="inline-flex rounded-full bg-market-oat px-2 py-1 text-xs font-black uppercase text-market-ink/65">
                {signal.verdict}
              </span>
              <span className="mt-2 block text-xs font-bold text-market-ink/50">
                {formatConfidence(signal.sourceConfidence)}
              </span>
            </div>
            <div className="min-w-0">
              <Link href={`/products/${signal.anchorSlug}`} className="block truncate font-black hover:text-market-mint">
                {signal.anchorName}
              </Link>
              <Link
                href={`/stores/${signal.anchorStoreSlug}`}
                className="mt-1 block truncate text-xs font-bold text-market-ink/55"
              >
                {signal.anchorStoreName}
              </Link>
            </div>
            <div className="min-w-0">
              <Link href={`/products/${signal.substituteSlug}`} className="block truncate font-black hover:text-market-mint">
                {signal.substituteName}
              </Link>
              <Link
                href={`/stores/${signal.substituteStoreSlug}`}
                className="mt-1 block truncate text-xs font-bold text-market-ink/55"
              >
                {signal.substituteStoreName}
              </Link>
              <p className="mt-2 leading-5 text-market-ink/65">{signal.reason}</p>
            </div>
            <div className="md:text-right">
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Impact</span>
              <span className="block font-black">{signal.basketImpact}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">OpenPrices fixture radar</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Live driver data is now visible on the homepage before shoppers drill into the full product screener.
            </p>
          </div>
          <LightMetric label="Products" value={pricedProducts.length.toLocaleString()} />
          <LightMetric label="Observations" value={totalObservedPrices.toLocaleString()} />
          <LightMetric label="Latest" value={latestPriceDate} />
        </div>
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3 border-b border-market-ink/10 p-4 lg:border-b-0 lg:border-r">
            <FixtureMetric
              icon={<Database size={18} />}
              label="Observed categories"
              value={String(activeOpenPriceCategories)}
              detail="OpenFoodFacts tags mapped into GroceryView category routes"
              href="/categories"
            />
            <FixtureMetric
              icon={<Store size={18} />}
              label="Mapped store brands"
              value={String(activeStoreBrands)}
              detail={`${osmStores.length.toLocaleString()} Stockholm county stores from the OSM fixture`}
              href="/stores"
            />
          </div>
          <div className="min-w-0">
            <div className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.7fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
              <span>High-signal product</span>
              <span>Category</span>
              <span>Median</span>
              <span className="text-right">Obs</span>
            </div>
            {openPriceLeaders.map((product) => (
              <Link
                key={product.code}
                href={`/categories/${product.category || 'pantry'}`}
                className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.7fr] gap-3 px-4 py-3 text-sm hover:bg-market-oat/45"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold">{product.name}</span>
                  <span className="mt-1 block truncate text-xs text-market-ink/50">{product.brands || product.code}</span>
                </span>
                <span className="truncate text-market-ink/65">{categoryLabels[product.category] || product.category}</span>
                <span className="font-bold tabular-nums">{formatSek(product.priceMedian)}</span>
                <span className="text-right tabular-nums text-market-ink/55">{product.observationCount}</span>
              </Link>
            ))}
          </div>
        </div>
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
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Store comparison board</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Route-ready comparisons pair visible store pages with the products that change a weekly basket.
            </p>
          </div>
          <LightMetric label="Comparisons" value={String(storeComparisonBoard.length)} />
        </div>
        <div className="grid gap-0 lg:grid-cols-2">
          {storeComparisonBoard.map((comparison) => (
            <div key={comparison.slug} className="border-b border-market-ink/10 px-4 py-4 text-sm lg:border-r">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{comparison.area}</span>
                  <span className="mt-1 block font-black">{comparison.basketFocus}</span>
                </div>
                <span className="rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                  {comparison.basketImpact}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-market-ink/60">
                <Link href={`/stores/${comparison.primaryStoreSlug}`} className="rounded-md bg-market-oat/60 px-2 py-1 hover:text-market-mint">
                  {comparison.primaryStoreName}
                </Link>
                <Link href={`/stores/${comparison.comparisonStoreSlug}`} className="rounded-md bg-market-oat/60 px-2 py-1 hover:text-market-mint">
                  {comparison.comparisonStoreName}
                </Link>
              </div>
              <p className="mt-3 leading-6 text-market-ink/65">{comparison.leadSignal}</p>
              <p className="mt-3 text-xs font-bold uppercase text-market-ink/45">
                {comparison.visibleItems} visible driver rows
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Source coverage tape</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            Driver rows expose which retailer surfaces are ready, in review, or still stubbed before live ingestion.
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3">
          {sourceCoverage.map((source) => (
            <div key={`${source.chain}-${source.fixture}`} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{source.chain}</span>
                  <span className="mt-1 block font-black">{source.fixture}</span>
                </div>
                <span className="rounded-full bg-market-oat px-2 py-1 text-xs font-bold uppercase text-market-ink/60">
                  {source.status}
                </span>
              </div>
              <p className="mt-3 text-market-ink/65">{source.newestSignal}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold uppercase text-market-ink/50">
                <span>{source.surface}</span>
                <span>{source.visibleRows} rows</span>
              </div>
            </div>
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
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Shopping trip switchboard</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Trip-sized driver rows show which store or category route can cover the next basket decision.
            </p>
          </div>
          <LightMetric label="Visible routes" value={String(shoppingTripSwitchboard.length)} />
        </div>
        <div className="grid gap-0 lg:grid-cols-3">
          {shoppingTripSwitchboard.map((trip) => (
            <Link
              key={trip.title}
              href={trip.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 lg:border-r"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{trip.area}</span>
                  <span className="mt-1 block font-black">{trip.title}</span>
                </div>
                <span className="shrink-0 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-bold text-market-ink/65">
                  {trip.saving}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs font-semibold text-market-ink/60">
                <div className="flex items-center justify-between gap-3">
                  <dt>Stop</dt>
                  <dd className="text-right text-market-ink">{trip.store}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Basket</dt>
                  <dd className="text-right text-market-ink">{trip.basket}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Category</dt>
                  <dd className="text-right text-market-ink">{trip.category}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Spend</dt>
                  <dd className="text-right text-market-ink">{trip.spend}</dd>
                </div>
              </dl>
              <p className="mt-4 leading-6 text-market-ink/65">{trip.decision}</p>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-market-ink/10 px-4 py-3 text-sm">
          <span className="font-bold text-market-ink/65">
            {mealPlanner.weekLabel}: {mealPlanner.plannedMeals} planned meals, {mealPlanner.projectedSavings} projected.
          </span>
          <Link
            href="/meal-planner"
            className="rounded-md bg-market-ink px-3 py-2 font-black text-white hover:bg-market-mint hover:text-market-ink"
          >
            Open planner
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-market-ink/10 px-4 py-3 text-sm">
          <span className="font-bold text-market-ink/65">
            {pantryPlanner.title}: {pantryPlanner.projectedSpend}, {pantryPlanner.projectedSavings} projected.
          </span>
          <Link
            href="/pantry-planner"
            className="rounded-md bg-market-oat px-3 py-2 font-black text-market-ink hover:bg-market-mint"
          >
            Open pantry plan
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-market-ink/10 px-4 py-3 text-sm">
          <span className="font-bold text-market-ink/65">
            {nutritionValueBoard.title}: {nutritionValueBoard.weeklySignal}
          </span>
          <Link
            href="/nutrition-value"
            className="rounded-md bg-market-oat px-3 py-2 font-black text-market-ink hover:bg-market-mint"
          >
            Open nutrition board
          </Link>
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
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Unit price alert desk</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Package-size alerts catch shelf prices that look acceptable until normalized by kilogram or liter.
            </p>
          </div>
          <LightMetric label="Alerts" value={String(unitPriceAlertDesk.length)} />
        </div>
        <div className="hidden grid-cols-[1.2fr_0.7fr_0.8fr_1fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
          <span>Product</span>
          <span>Unit price</span>
          <span>Severity</span>
          <span>Benchmark</span>
        </div>
        {unitPriceAlertDesk.map((alert) => (
          <div
            key={alert.productSlug}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[1.2fr_0.7fr_0.8fr_1fr]"
          >
            <div>
              <Link href={`/products/${alert.productSlug}`} className="block font-black hover:text-market-mint">
                {alert.productName}
              </Link>
              <Link href={`/stores/${alert.storeSlug}`} className="mt-1 block text-xs font-bold text-market-ink/55">
                {alert.storeName} · {alert.packageSize} · {alert.shelfPrice}
              </Link>
              <p className="mt-2 leading-5 text-market-ink/65">{alert.reason}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Unit price</span>
              <span className="block font-black tabular-nums">{alert.unitPrice}</span>
            </div>
            <div>
              <span className="inline-flex rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black uppercase text-market-ink/70">
                {alert.severity}
              </span>
            </div>
            <div className="font-semibold text-market-ink/65">{alert.benchmark}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Coupon stack planner</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Digital coupons, member prices, and receipt bonuses stay visible before the basket total is trusted.
            </p>
          </div>
          <LightMetric label="Stacks" value={String(couponStackPlanner.length)} />
          <LightMetric
            label="Visible impact"
            value={`-${couponStackPlanner
              .reduce((sum, stack) => sum + Number(stack.basketImpact.replace(/[^0-9.]/g, '')), 0)
              .toFixed(2)} SEK`}
          />
        </div>
        <div className="hidden grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
          <span>Stack</span>
          <span>Coupon</span>
          <span>Final price</span>
          <span>State</span>
        </div>
        {couponStackPlanner.map((stack) => (
          <div
            key={stack.title}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr]"
          >
            <div>
              <Link href={`/products/${stack.productSlug}`} className="block font-black hover:text-market-mint">
                {stack.productName}
              </Link>
              <Link href={`/stores/${stack.storeSlug}`} className="mt-1 block text-xs font-bold text-market-ink/55">
                {stack.storeName} · {stack.basePrice}
              </Link>
              <p className="mt-2 leading-5 text-market-ink/65">{stack.nextAction}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Coupon</span>
              <span className="block font-semibold text-market-ink/70">{stack.coupon}</span>
              <span className="mt-1 block text-xs font-bold text-market-ink/50">{stack.memberPrice}</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Final price</span>
              <span className="block font-black tabular-nums">{stack.finalPrice}</span>
              <span className="mt-1 block text-xs font-bold text-market-ink/50">{stack.basketImpact}</span>
            </div>
            <div>
              <span className="inline-flex rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black uppercase text-market-ink/70">
                {stack.stackState}
              </span>
            </div>
          </div>
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

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Receipt review desk</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Receipt rows expose review state, confidence, owner, and the exact product lines waiting to update prices.
            </p>
          </div>
          <LightMetric label="Receipts" value={String(receiptReviewDesk.length)} />
          <LightMetric
            label="Lowest confidence"
            value={formatConfidence(Math.min(...receiptReviewDesk.map((receipt) => receipt.confidence)))}
          />
        </div>
        <div className="hidden grid-cols-[1fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
          <span>Receipt</span>
          <span>Status</span>
          <span>Confidence</span>
          <span>Flagged lines</span>
        </div>
        {receiptReviewDesk.map((receipt) => (
          <div
            key={receipt.receiptId}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[1fr_0.8fr_0.7fr_0.9fr]"
          >
            <div>
              <Link href={`/stores/${receipt.storeSlug}`} className="block font-black hover:text-market-mint">
                {receipt.storeName}
              </Link>
              <span className="mt-1 block text-xs font-semibold text-market-ink/50">{receipt.capturedAt}</span>
              <span className="mt-2 block font-bold tabular-nums">{receipt.total}</span>
            </div>
            <div>
              <span className="inline-flex rounded-full bg-market-oat px-2 py-1 text-xs font-black uppercase text-market-ink/65">
                {receipt.status}
              </span>
              <span className="mt-2 block text-xs font-semibold text-market-ink/55">Owner: {receipt.owner}</span>
              <p className="mt-2 leading-5 text-market-ink/65">{receipt.nextAction}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-market-ink/45 md:hidden">Confidence</span>
              <span className="block text-2xl font-black tabular-nums">{formatConfidence(receipt.confidence)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {receipt.flaggedLines.map((line) => (
                <Link
                  key={`${receipt.receiptId}-${line.productSlug}`}
                  href={`/products/${line.productSlug}`}
                  className="rounded-full bg-market-mint/15 px-2 py-1 text-xs font-bold text-market-ink/70 hover:text-market-mint"
                >
                  {line.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Savings playbook</h2>
          <p className="mt-1 text-sm text-market-ink/60">
            Driver-backed actions translate price movement into concrete shopping decisions.
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {savingsPlaybook.map((play) => (
            <Link
              key={play.title}
              href={play.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 md:border-r"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-black">{play.title}</span>
                <span className="shrink-0 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-bold text-market-ink/65">
                  {play.impact}
                </span>
              </div>
              <p className="mt-3 font-semibold text-market-ink/70">{play.trigger}</p>
              <p className="mt-2 leading-6 text-market-ink/60">{play.action}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Meal basket ideas</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Shopper-ready baskets combine visible product rows, district context, and route notes.
            </p>
          </div>
          <LightMetric label="Visible baskets" value={String(mealBasketIdeas.length)} />
        </div>
        <div className="grid gap-0 lg:grid-cols-3">
          {mealBasketIdeas.map((basket) => (
            <div key={basket.title} className="border-b border-market-ink/10 px-4 py-4 text-sm lg:border-r">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{basket.area}</span>
                  <h3 className="mt-1 font-black capitalize">{basket.title}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                  {basket.savings}
                </span>
              </div>
              <p className="mt-3 leading-6 text-market-ink/65">{basket.route}</p>
              <div className="mt-4 flex items-baseline justify-between border-t border-market-ink/10 pt-3">
                <span className="text-xs font-bold uppercase text-market-ink/50">Projected total</span>
                <span className="font-black tabular-nums">{basket.total}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {basket.products.map((slug) => {
                  const product = products.find((candidate) => candidate.slug === slug);

                  return (
                    <Link
                      key={slug}
                      href={`/products/${slug}`}
                      className="rounded-full bg-market-oat px-2 py-1 text-xs font-bold text-market-ink/65 hover:text-market-mint"
                    >
                      {product?.ticker ?? slug}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Receipt review queue</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Scanner-bound receipts show which medium-confidence basket rows still need household review.
            </p>
          </div>
          <LightMetric label="Queued" value={String(receiptReviewQueue.length)} />
        </div>
        <div className="grid gap-0 lg:grid-cols-3">
          {receiptReviewQueue.map((receipt) => (
            <Link
              key={receipt.receipt}
              href={receipt.href}
              className="border-b border-market-ink/10 px-4 py-4 text-sm hover:bg-market-oat/45 lg:border-r"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase text-market-ink/50">{receipt.area}</span>
                  <span className="mt-1 block font-black">{receipt.receipt}</span>
                </div>
                <span className="shrink-0 rounded-full bg-market-mint/15 px-2 py-1 text-xs font-black text-market-ink/70">
                  {receipt.impact}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs font-semibold text-market-ink/60">
                <div className="flex items-center justify-between gap-3">
                  <dt>Store</dt>
                  <dd className="text-right text-market-ink">{receipt.store}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Items</dt>
                  <dd className="text-right text-market-ink">{receipt.items}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Confidence</dt>
                  <dd className="text-right text-market-ink">{receipt.confidence}</dd>
                </div>
              </dl>
              <p className="mt-4 leading-6 text-market-ink/65">{receipt.issue}</p>
            </Link>
          ))}
        </div>
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

function FixtureMetric({
  icon,
  label,
  value,
  detail,
  href
}: Readonly<{ icon: React.ReactNode; label: string; value: string; detail: string; href: string }>) {
  return (
    <Link href={href} className="rounded-lg border border-market-ink/10 p-4 hover:border-market-mint/70">
      <div className="flex items-center justify-between gap-4">
        <span className="text-market-mint">{icon}</span>
        <strong className="text-3xl tabular-nums">{value}</strong>
      </div>
      <p className="mt-4 font-black">{label}</p>
      <p className="mt-1 text-sm leading-6 text-market-ink/60">{detail}</p>
    </Link>
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
