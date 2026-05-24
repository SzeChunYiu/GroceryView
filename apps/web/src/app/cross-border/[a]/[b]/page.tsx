import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type CountryCode = 'se' | 'no' | 'is';

type CountryMarket = {
  code: CountryCode;
  countryCode: 'SE' | 'NO' | 'IS';
  name: string;
  city: string;
  retailerHint: string;
  currency: 'SEK' | 'NOK' | 'ISK';
  toSekRate: number;
  vatNote: string;
  priceSource: string;
};

type BasketItem = {
  label: string;
  quantity: string;
  prices: Record<CountryCode, number>;
};

type RouteScenario = {
  slug: string;
  title: string;
  distanceKm: number;
  fuelOrFerryCostSek: number;
  tollOrParkingSek: number;
  timeCostSek: number;
  note: string;
};

const markets: Record<CountryCode, CountryMarket> = {
  se: {
    code: 'se',
    countryCode: 'SE',
    name: 'Sweden',
    city: 'Strömstad',
    retailerHint: 'Willys/Hemköp-style SEK shelf basket',
    currency: 'SEK',
    toSekRate: 1,
    vatNote: 'SE grocery VAT modelled at local shelf price level',
    priceSource: 'GroceryView Swedish observed-product snapshot'
  },
  no: {
    code: 'no',
    countryCode: 'NO',
    name: 'Norway',
    city: 'Halden',
    retailerHint: 'Norwegian NOK basket for border-shopping parity',
    currency: 'NOK',
    toSekRate: 0.97,
    vatNote: 'NO food VAT and deposit differences remain in local shelf prices',
    priceSource: 'GroceryView Nordic comparator seed row'
  },
  is: {
    code: 'is',
    countryCode: 'IS',
    name: 'Iceland',
    city: 'Reykjavík',
    retailerHint: 'Icelandic ISK basket for air/ferry trip sensitivity',
    currency: 'ISK',
    toSekRate: 0.073,
    vatNote: 'IS grocery VAT and island logistics remain in local shelf prices',
    priceSource: 'GroceryView Nordic comparator seed row'
  }
};

const basketItems: BasketItem[] = [
  { label: 'Milk, 1 litre', quantity: '4 × 1 l', prices: { se: 59.6, no: 78.4, is: 1396 } },
  { label: 'Bread, family loaf', quantity: '3 loaves', prices: { se: 86.7, no: 108.9, is: 1770 } },
  { label: 'Eggs, 12-pack', quantity: '2 packs', prices: { se: 76.0, no: 92.0, is: 1598 } },
  { label: 'Ground coffee', quantity: '2 × 450 g', prices: { se: 125.8, no: 159.8, is: 2598 } },
  { label: 'Chicken fillet', quantity: '1.6 kg', prices: { se: 151.8, no: 207.8, is: 3376 } },
  { label: 'Apples', quantity: '2 kg', prices: { se: 49.8, no: 69.8, is: 1098 } }
];

const routeScenarios: Record<string, RouteScenario> = {
  'se-no': {
    slug: 'se-no',
    title: 'Strömstad ↔ Halden car trip',
    distanceKm: 72,
    fuelOrFerryCostSek: 118,
    tollOrParkingSek: 34,
    timeCostSek: 210,
    note: 'Useful for frequent border shoppers deciding whether a full family basket offsets car and time costs.'
  },
  'no-se': {
    slug: 'no-se',
    title: 'Halden ↔ Strömstad car trip',
    distanceKm: 72,
    fuelOrFerryCostSek: 118,
    tollOrParkingSek: 34,
    timeCostSek: 210,
    note: 'Same corridor with Norway as home market; savings are calculated against a Swedish destination basket.'
  },
  'se-is': {
    slug: 'se-is',
    title: 'Sweden ↔ Iceland stock-up sensitivity',
    distanceKm: 0,
    fuelOrFerryCostSek: 1450,
    tollOrParkingSek: 180,
    timeCostSek: 620,
    note: 'Long-haul scenario keeps travel explicit so shelf savings are not mistaken for trip savings.'
  },
  'is-se': {
    slug: 'is-se',
    title: 'Iceland ↔ Sweden stock-up sensitivity',
    distanceKm: 0,
    fuelOrFerryCostSek: 1450,
    tollOrParkingSek: 180,
    timeCostSek: 620,
    note: 'Designed for Iceland residents comparing a Swedish grocery stock-up against local ISK prices.'
  },
  'no-is': {
    slug: 'no-is',
    title: 'Norway ↔ Iceland basket-only comparison',
    distanceKm: 0,
    fuelOrFerryCostSek: 1620,
    tollOrParkingSek: 210,
    timeCostSek: 690,
    note: 'Highlights how quickly air/ferry friction can erase shelf-level savings.'
  },
  'is-no': {
    slug: 'is-no',
    title: 'Iceland ↔ Norway basket-only comparison',
    distanceKm: 0,
    fuelOrFerryCostSek: 1620,
    tollOrParkingSek: 210,
    timeCostSek: 690,
    note: 'Uses the same friction model with Iceland as the home basket.'
  }
};

export function generateStaticParams() {
  return (Object.keys(routeScenarios) as Array<keyof typeof routeScenarios>).map((pair) => {
    const [a, b] = pair.split('-');
    return { a, b };
  });
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ a: string; b: string }> }>) {
  const { a, b } = await params;
  const home = marketFor(a);
  const away = marketFor(b);
  if (!home || !away || home.code === away.code) notFound();
  return routeMetadata({
    path: `/cross-border/${home.code}/${away.code}`,
    title: `${home.name} vs ${away.name} grocery border-shopping calculator | GroceryView`,
    description: `Compare a fixed grocery basket in ${home.currency} and ${away.currency}, convert both to SEK, and show whether shelf savings survive travel costs.`
  });
}

export default async function CrossBorderSavingsPage({ params }: Readonly<{ params: Promise<{ a: string; b: string }> }>) {
  const { a, b } = await params;
  const home = marketFor(a);
  const away = marketFor(b);
  if (!home || !away || home.code === away.code) notFound();

  const comparison = compareMarkets(home, away);
  const scenario = routeScenarios[`${home.code}-${away.code}`];
  if (!scenario) notFound();
  const tripCostSek = scenario.fuelOrFerryCostSek + scenario.tollOrParkingSek + scenario.timeCostSek;
  const netSavingsSek = comparison.savingsSek - tripCostSek;
  const breakEvenBaskets = comparison.savingsSek > 0 ? Math.ceil(tripCostSek / comparison.savingsSek) : null;
  const winner = comparison.savingsSek > 0 ? away : home;

  return (
    <PageShell>
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-2xl md:p-10">
        <div className="absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute bottom-[-9rem] left-[20%] h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative max-w-4xl">
          <Eyebrow>Cross-border savings comparator</Eyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            {home.name} → {away.name} basket calculus without hiding the trip cost.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
            The route keeps local grocery currencies intact, converts both baskets to SEK for one common ledger, then subtracts travel friction for {scenario.title.toLowerCase()}.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <HeroMetric label="Home basket" value={formatMoney(comparison.homeLocal, home.currency)} detail={`${formatSek(comparison.homeSek)} after FX`} />
            <HeroMetric label="Away basket" value={formatMoney(comparison.awayLocal, away.currency)} detail={`${formatSek(comparison.awaySek)} after FX`} />
            <HeroMetric label="Net after trip" value={formatSignedSek(netSavingsSek)} detail={netSavingsSek >= 0 ? 'trip still pays' : 'trip erases shelf savings'} tone={netSavingsSek >= 0 ? 'good' : 'bad'} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-emerald-200 bg-emerald-50/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Currency-aware shelf comparison</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Fixed family basket</h2>
            </div>
            <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900">
              Winner before travel: {winner.name}
            </p>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-100 bg-white">
            <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr_0.8fr] gap-3 bg-emerald-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              <span>Item</span>
              <span>Qty</span>
              <span>{home.currency}</span>
              <span>{away.currency}</span>
              <span>SEK delta</span>
            </div>
            <div className="divide-y divide-emerald-100">
              {comparison.rows.map((row) => (
                <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr_0.8fr] gap-3 px-4 py-4 text-sm" key={row.label}>
                  <p className="font-black text-slate-950">{row.label}</p>
                  <p className="font-semibold text-slate-600">{row.quantity}</p>
                  <p className="font-semibold text-slate-800">{formatMoney(row.homeLocal, home.currency)}</p>
                  <p className="font-semibold text-slate-800">{formatMoney(row.awayLocal, away.currency)}</p>
                  <p className={`font-black ${row.savingsSek >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>{formatSignedSek(row.savingsSek)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50/80">
          <Eyebrow>Border-shopping calculus</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Travel costs are first-class inputs</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{scenario.note}</p>
          <dl className="mt-5 space-y-3 text-sm">
            <LedgerRow label="Shelf savings" value={formatSignedSek(comparison.savingsSek)} strong />
            <LedgerRow label="Fuel / ferry" value={`-${formatSek(scenario.fuelOrFerryCostSek)}`} />
            <LedgerRow label="Tolls / parking" value={`-${formatSek(scenario.tollOrParkingSek)}`} />
            <LedgerRow label="Time cost" value={`-${formatSek(scenario.timeCostSek)}`} />
            <LedgerRow label="Net trip value" value={formatSignedSek(netSavingsSek)} strong tone={netSavingsSek >= 0 ? 'good' : 'bad'} />
          </dl>
          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Break-even</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {breakEvenBaskets ? `${breakEvenBaskets} basket${breakEvenBaskets === 1 ? '' : 's'}` : 'No shelf advantage'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {breakEvenBaskets
                ? `A shopper needs at least ${breakEvenBaskets} comparable basket run${breakEvenBaskets === 1 ? '' : 's'} before the explicit ${formatSek(tripCostSek)} trip friction is covered.`
                : `${away.name} is not cheaper on this basket after FX, so travel cannot break even.`}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {[home, away].map((market) => (
          <Card className="bg-white" key={market.code}>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{market.countryCode} market</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{market.city}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{market.retailerHint}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <LedgerRow label="Currency" value={market.currency} />
              <LedgerRow label="FX to SEK" value={market.toSekRate.toFixed(3)} />
              <LedgerRow label="Basket source" value={market.priceSource} />
            </dl>
            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">{market.vatNote}</p>
          </Card>
        ))}
        <Card className="border-slate-300 bg-slate-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Switch corridor</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Compare another pair</h3>
          <div className="mt-4 grid gap-2">
            {Object.values(routeScenarios).map((route) => {
              const [routeA, routeB] = route.slug.split('-') as [CountryCode, CountryCode];
              return (
                <Link
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${route.slug === scenario.slug ? 'bg-slate-950 text-white' : 'bg-white text-slate-800 hover:bg-emerald-100'}`}
                  href={`/cross-border/${routeA}/${routeB}`}
                  key={route.slug}
                >
                  {markets[routeA].name} → {markets[routeB].name}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function marketFor(value: string): CountryMarket | null {
  const code = value.toLowerCase();
  return code === 'se' || code === 'no' || code === 'is' ? markets[code] : null;
}

function compareMarkets(home: CountryMarket, away: CountryMarket) {
  const rows = basketItems.map((item) => {
    const homeLocal = item.prices[home.code];
    const awayLocal = item.prices[away.code];
    const homeSek = round(homeLocal * home.toSekRate);
    const awaySek = round(awayLocal * away.toSekRate);
    return {
      label: item.label,
      quantity: item.quantity,
      homeLocal,
      awayLocal,
      homeSek,
      awaySek,
      savingsSek: round(homeSek - awaySek)
    };
  });
  const homeLocal = round(rows.reduce((sum, row) => sum + row.homeLocal, 0));
  const awayLocal = round(rows.reduce((sum, row) => sum + row.awayLocal, 0));
  const homeSek = round(rows.reduce((sum, row) => sum + row.homeSek, 0));
  const awaySek = round(rows.reduce((sum, row) => sum + row.awaySek, 0));
  return {
    rows,
    homeLocal,
    awayLocal,
    homeSek,
    awaySek,
    savingsSek: round(homeSek - awaySek)
  };
}

function formatMoney(value: number, currency: CountryMarket['currency']) {
  return new Intl.NumberFormat(currency === 'ISK' ? 'is-IS' : currency === 'NOK' ? 'nb-NO' : 'sv-SE', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'ISK' ? 0 : 2
  }).format(value);
}

function formatSek(value: number) {
  return formatMoney(value, 'SEK');
}

function formatSignedSek(value: number) {
  const formatted = formatSek(Math.abs(value));
  return `${value >= 0 ? '+' : '-'}${formatted}`;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function HeroMetric({ label, value, detail, tone = 'neutral' }: Readonly<{ label: string; value: string; detail: string; tone?: 'neutral' | 'good' | 'bad' }>) {
  const toneClass = tone === 'good' ? 'text-emerald-200' : tone === 'bad' ? 'text-rose-200' : 'text-white';
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-300">{detail}</p>
    </div>
  );
}

function LedgerRow({ label, value, strong = false, tone = 'neutral' }: Readonly<{ label: string; value: string; strong?: boolean; tone?: 'neutral' | 'good' | 'bad' }>) {
  const valueClass = tone === 'good' ? 'text-emerald-800' : tone === 'bad' ? 'text-rose-700' : 'text-slate-950';
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? 'border-t border-slate-200 pt-3 text-base' : ''}`}>
      <dt className={strong ? 'font-black text-slate-950' : 'font-semibold text-slate-600'}>{label}</dt>
      <dd className={`${strong ? 'font-black' : 'font-bold'} ${valueClass}`}>{value}</dd>
    </div>
  );
}
