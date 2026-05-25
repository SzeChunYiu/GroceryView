import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type CountryConfig = {
  slug: string;
  market: string;
  currency: string;
};

type GroupBuyPromo = {
  id: string;
  title: string;
  chain: string;
  category: string;
  unitPrice: string;
  tier: string;
  committedUnits: number;
  requiredUnits: number;
  pickupPoint: string;
  paymentSplit: string;
  sharedList: readonly string[];
};

const countries = [
  { slug: 'sweden', market: 'Sweden', currency: 'SEK' },
  { slug: 'norway', market: 'Norway', currency: 'NOK' },
  { slug: 'denmark', market: 'Denmark', currency: 'DKK' },
  { slug: 'finland', market: 'Finland', currency: 'EUR' },
  { slug: 'iceland', market: 'Iceland', currency: 'ISK' }
] as const satisfies readonly CountryConfig[];

const groupBuyPromos: readonly GroupBuyPromo[] = [
  {
    id: 'oat-milk-case',
    title: 'Oat milk case unlock',
    chain: 'Willys',
    category: 'Dairy alternatives',
    unitPrice: '15.90 SEK/carton',
    tier: '24 units unlock the bulk shelf price',
    committedUnits: 17,
    requiredUnits: 24,
    pickupPoint: 'Hornstull pickup shelf · Saturday 10:00',
    paymentSplit: 'Split by cartons reserved; organizer pays remainder only after tier is met.',
    sharedList: ['Anna household · 6 cartons', 'Khan household · 8 cartons', 'Rivera household · 3 cartons']
  },
  {
    id: 'coffee-beans',
    title: 'Coffee beans pantry refill',
    chain: 'ICA',
    category: 'Coffee & Tea',
    unitPrice: '79.00 SEK/bag',
    tier: '10 bags unlock member bulk discount',
    committedUnits: 6,
    requiredUnits: 10,
    pickupPoint: 'Liljeholmen commuter pickup · Friday 17:30',
    paymentSplit: 'Each household confirms MobilePay/Swish share before checkout.',
    sharedList: ['Maja household · 2 bags', 'Olsen household · 2 bags', 'Singh household · 2 bags']
  },
  {
    id: 'freezer-veg',
    title: 'Frozen vegetable freezer pack',
    chain: 'Coop',
    category: 'Frozen',
    unitPrice: '22.50 SEK/bag',
    tier: '18 bags unlock family-pack discount',
    committedUnits: 12,
    requiredUnits: 18,
    pickupPoint: 'Årsta shared freezer locker · Sunday 12:00',
    paymentSplit: 'Split evenly by reserved bags with pickup confirmation before reimbursement.',
    sharedList: ['Nordin household · 4 bags', 'Li household · 5 bags', 'Patel household · 3 bags']
  }
];

function findCountry(country: string) {
  return countries.find((entry) => entry.slug === country.toLowerCase());
}

function progressPercent(promo: GroupBuyPromo) {
  return Math.min(100, Math.round((promo.committedUnits / promo.requiredUnits) * 100));
}

export function generateStaticParams() {
  return countries.map((entry) => ({ country: entry.slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const config = findCountry(country);
  if (!config) notFound();

  return routeMetadata({
    path: `/${config.slug}/group-buys`,
    title: `${config.market} group-buy coordinator | GroceryView`,
    description: 'Coordinate household bulk-discount unlocks with shared lists, pickup points, and payment split notes.'
  });
}

export default async function GroupBuysPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const config = findCountry(country);
  if (!config) notFound();

  return (
    <PageShell>
      <Eyebrow>{config.market} group buys</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Bulk discounts households can unlock together</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Coordinate shared grocery lists, pickup points, and payment splits for promos that need a minimum unit threshold before the lower price applies.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Active promos" value={groupBuyPromos.length.toLocaleString('sv-SE')} />
        <Metric label="Currency" value={config.currency} />
        <Metric label="Coordination mode" value="Household opt-in" />
      </div>

      <div className="mt-6 grid gap-5">
        {groupBuyPromos.map((promo) => {
          const remaining = Math.max(0, promo.requiredUnits - promo.committedUnits);
          return (
            <Card className="border-emerald-200 bg-white" key={promo.id}>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.45fr] lg:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{promo.chain} · {promo.category}</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{promo.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{promo.tier}</p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${progressPercent(promo)} percent committed`}>
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercent(promo)}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-black text-emerald-900">{promo.committedUnits}/{promo.requiredUnits} units committed · {remaining} to unlock</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-900">Bulk unit price</p>
                  <p className="mt-2 text-2xl font-black text-emerald-950">{promo.unitPrice}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">{promo.paymentSplit}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-600">Shared list</h3>
                  <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                    {promo.sharedList.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </section>
                <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-600">Pickup point</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{promo.pickupPoint}</p>
                  <button className="mt-4 rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" type="button">Join coordination list</button>
                </section>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Card className="bg-white">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </Card>
  );
}
