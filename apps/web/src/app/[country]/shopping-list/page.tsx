import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { chainPriceRows, formatSek, labelFromSlug, snapshot, topChainSpreads } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

type CountryShoppingListParams = {
  country: string;
};

type StoreChain = 'willys' | 'hemkop';

type StoreProfile = {
  chain: StoreChain;
  label: string;
  distanceKm: number;
  routeOrder: number;
  travelCostSek: number;
  travelMinutes: number;
  aisleCue: string;
  routeCue: string;
};

type SmartListItem = {
  id: string;
  name: string;
  brand: string;
  categoryLabel: string;
  packageLabel: string;
  slug: string;
  checked: boolean;
  quantity: string;
  options: Array<{
    chain: StoreChain;
    storeName: string;
    shelfPrice: number;
    priceText: string;
    promotionSaving: number;
    distancePenalty: number;
    effectiveScore: number;
  }>;
};

const secondStopSavingsThresholdSek = 45;

const storeProfiles: Record<StoreChain, StoreProfile> = {
  willys: {
    chain: 'willys',
    label: 'Willys Kungsholmen',
    distanceKm: 1.6,
    routeOrder: 1,
    travelCostSek: 18,
    travelMinutes: 9,
    aisleCue: 'start with produce, finish frozen',
    routeCue: 'closest first stop from home'
  },
  hemkop: {
    chain: 'hemkop',
    label: 'Hemköp City',
    distanceKm: 2.4,
    routeOrder: 2,
    travelCostSek: 31,
    travelMinutes: 14,
    aisleCue: 'bakery entrance, dairy before checkout',
    routeCue: 'second stop only when savings clears threshold'
  }
};

const chainLabels: Record<string, string> = {
  hemkop: 'Hemköp',
  willys: 'Willys'
};

function chainName(chainId: string) {
  return chainLabels[chainId] ?? chainId.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function listCandidates(): SmartListItem[] {
  return topChainSpreads
    .map((product, index) => {
      const options = chainPriceRows(product)
        .filter((row): row is ReturnType<typeof chainPriceRows>[number] & { chain: StoreChain; price: number } => row.chain === 'willys' || row.chain === 'hemkop')
        .map((row) => {
          const store = storeProfiles[row.chain];
          const promotionSaving = typeof row.savings === 'number' && Number.isFinite(row.savings) && row.savings > 0 ? row.savings : 0;
          const distancePenalty = store.distanceKm * 2.25;

          return {
            chain: row.chain,
            storeName: chainName(row.chain),
            shelfPrice: row.price,
            priceText: row.priceText,
            promotionSaving,
            distancePenalty,
            effectiveScore: row.price + distancePenalty - promotionSaving * 0.35
          };
        })
        .sort((left, right) => left.effectiveScore - right.effectiveScore || left.shelfPrice - right.shelfPrice || left.chain.localeCompare(right.chain, 'sv'));

      if (options.length === 0) return null;

      return {
        id: product.slug,
        name: product.name,
        brand: product.brand || 'Brand not reported',
        categoryLabel: labelFromSlug(product.category),
        packageLabel: product.subline,
        slug: product.slug,
        checked: index === 1 || index === 4,
        quantity: index % 3 === 0 ? '2 packs' : '1 pack',
        options
      };
    })
    .filter((item): item is SmartListItem => item !== null)
    .slice(0, 8);
}

function bestOptionFor(item: SmartListItem) {
  return item.options[0];
}

function singleStoreTotals(items: readonly SmartListItem[]) {
  return Object.values(storeProfiles)
    .map((store) => {
      const pricedItems = items
        .map((item) => ({ item, option: item.options.find((option) => option.chain === store.chain) }))
        .filter((entry): entry is { item: SmartListItem; option: NonNullable<ReturnType<typeof bestOptionFor>> } => entry.option !== undefined);
      const shelfTotal = pricedItems.reduce((sum, entry) => sum + entry.option.shelfPrice, 0);
      return {
        store,
        itemCount: pricedItems.length,
        missingCount: Math.max(0, items.length - pricedItems.length),
        shelfTotal,
        tripTotal: shelfTotal + store.travelCostSek,
        promotionTotal: pricedItems.reduce((sum, entry) => sum + entry.option.promotionSaving, 0)
      };
    })
    .sort((left, right) => left.tripTotal - right.tripTotal || left.store.chain.localeCompare(right.store.chain, 'sv'));
}

function splitRoute(items: readonly SmartListItem[]) {
  const assignments = items.map((item) => ({ item, option: bestOptionFor(item) })).filter((entry): entry is { item: SmartListItem; option: NonNullable<ReturnType<typeof bestOptionFor>> } => entry.option !== undefined);
  const visitedChains = Array.from(new Set(assignments.map((entry) => entry.option.chain)));
  const stops = visitedChains
    .map((chain) => storeProfiles[chain])
    .sort((left, right) => left.routeOrder - right.routeOrder);
  const shelfTotal = assignments.reduce((sum, entry) => sum + entry.option.shelfPrice, 0);
  const travelTotal = stops.reduce((sum, stop) => sum + stop.travelCostSek, 0);
  const promotionTotal = assignments.reduce((sum, entry) => sum + entry.option.promotionSaving, 0);

  return {
    assignments,
    stops,
    shelfTotal,
    travelTotal,
    promotionTotal,
    tripTotal: shelfTotal + travelTotal
  };
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

export async function generateMetadata({ params }: { params: Promise<CountryShoppingListParams> }) {
  const { country } = await params;

  return routeMetadata({
    path: `/${country}/shopping-list`,
    title: 'Smart shopping list with cheapest source | GroceryView',
    description: 'Cross off grocery items while GroceryView surfaces the cheapest current store per item and recommends a second stop only when the verified saving clears the configured threshold.'
  });
}

export default function SmartShoppingListPage() {
  const items = listCandidates();
  const singleStores = singleStoreTotals(items);
  const bestSingleStore = singleStores[0];
  const route = splitRoute(items);
  const splitSavings = bestSingleStore ? bestSingleStore.tripTotal - route.tripTotal : 0;
  const shouldSplit = splitSavings > secondStopSavingsThresholdSek && route.stops.length > 1;
  const activeRouteStops = shouldSplit ? route.stops : bestSingleStore ? [bestSingleStore.store] : [];
  const checkedCount = items.filter((item) => item.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <PageShell>
      <section className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_34%),linear-gradient(135deg,#fff7ed,#f8fafc_58%,#ecfeff)] p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Eyebrow>Smart shopping list</Eyebrow>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Cross off items while the route engine picks the cheapest source.
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
              This static country page combines current verified chain rows, distance penalties, and observed promotion savings. A second stop is recommended only when it beats the best one-store trip by more than {formatSek(secondStopSavingsThresholdSek)}.
            </p>
          </div>
          <Card className="border-slate-900 bg-slate-950 text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Recommended trip</p>
            <p className="mt-3 text-4xl font-black tracking-tight">{shouldSplit ? 'Split shop' : 'One stop'}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
              {activeRouteStops.map((stop) => stop.label).join(' → ') || 'No verified stores'} · {formatSek(shouldSplit ? route.tripTotal : bestSingleStore?.tripTotal ?? 0)} estimated with travel.
            </p>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <p className="text-sm font-black text-emerald-100">{formatSek(Math.max(0, splitSavings))} saved by a second stop</p>
              <p className="mt-1 text-xs font-semibold text-slate-300">Threshold: {formatSek(secondStopSavingsThresholdSek)}. Travel cost is included before recommending the route.</p>
            </div>
          </Card>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card className="border-lime-200 bg-lime-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-lime-800">List progress</p>
          <p className="mt-2 text-4xl font-black text-lime-950">{checkedCount}/{items.length}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-lime-700" style={{ width: pct(progress) }} />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Cheapest shelf total</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatSek(route.shelfTotal)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Sum of each item&apos;s current cheapest observed shelf row.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Promotion impact</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatSek(route.promotionTotal)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Observed savings lower the source score before distance penalties are applied.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Source snapshot</p>
          <p className="mt-2 text-xl font-black text-slate-950">{snapshot.retrievedLabel}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">{snapshot.axfoodSource}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-emerald-200 bg-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Item-by-item cheapest source</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Tap checkboxes as you shop</h2>
            </div>
            <p className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">Native cross-off controls</p>
          </div>
          <ul className="mt-5 space-y-3">
            {items.map((item) => {
              const best = bestOptionFor(item);
              const alternate = item.options[1];
              const checkboxId = `smart-list-${item.id}`;

              return (
                <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
                  <div className="grid gap-4 md:grid-cols-[auto_1fr_13rem] md:items-start">
                    <input className="peer mt-2 h-5 w-5 accent-emerald-700" defaultChecked={item.checked} id={checkboxId} type="checkbox" />
                    <label className="cursor-pointer peer-checked:opacity-60 peer-checked:line-through" htmlFor={checkboxId}>
                      <span className="block text-lg font-black text-slate-950">{item.name}</span>
                      <span className="mt-1 block text-sm font-semibold text-slate-600">{item.quantity} · {item.packageLabel} · {item.categoryLabel} · {item.brand}</span>
                      <span className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-950">Cheapest now: {best?.storeName ?? 'No store'}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-700">distance score +{best ? formatSek(best.distancePenalty) : formatSek(0)}</span>
                        {best && best.promotionSaving > 0 ? <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-950">promo {formatSek(best.promotionSaving)} saved</span> : null}
                      </span>
                    </label>
                    <span className="rounded-2xl bg-white p-3 text-sm shadow-sm">
                      <span className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">best source</span>
                      <span className="mt-1 block text-2xl font-black text-emerald-800">{best?.priceText ?? 'n/a'}</span>
                      {alternate ? <span className="mt-1 block font-semibold text-slate-600">Next: {alternate.storeName} {alternate.priceText}</span> : null}
                      <Link className="mt-3 inline-flex text-xs font-black text-emerald-800 underline" href={`/products/${item.slug}`}>Open product</Link>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="border-sky-200 bg-sky-50">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Route optimizer</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{shouldSplit ? 'Visit both stores' : `Visit ${bestSingleStore?.store.label ?? 'one store'}`}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-sky-950">
              {shouldSplit
                ? `Second stop clears the ${formatSek(secondStopSavingsThresholdSek)} rule after travel costs.`
                : `The split route saves only ${formatSek(Math.max(0, splitSavings))}, so the list stays one-stop.`}
            </p>
            <ol className="mt-4 space-y-3">
              {activeRouteStops.map((stop, index) => (
                <li className="rounded-2xl bg-white p-4" key={stop.chain}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Stop {index + 1}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{stop.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{stop.distanceKm} km · {stop.travelMinutes} min · {stop.aisleCue}</p>
                  <p className="mt-2 rounded-xl bg-sky-50 p-2 text-xs font-bold text-sky-950">{stop.routeCue}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">One-store comparison</p>
            <div className="mt-4 space-y-3">
              {singleStores.map((store) => (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3" key={store.store.chain}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{store.store.label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">{store.itemCount}/{items.length} matched items · travel {formatSek(store.store.travelCostSek)}</p>
                    </div>
                    <p className="text-lg font-black text-slate-950">{formatSek(store.tripTotal)}</p>
                  </div>
                  {store.missingCount > 0 ? <p className="mt-2 text-xs font-bold text-amber-800">{store.missingCount} item(s) missing from this chain snapshot.</p> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
