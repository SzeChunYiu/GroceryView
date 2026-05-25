import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const rescueOffers = [
  {
    provider: 'Too Good To Go',
    title: 'Bakery surprise bag',
    surplusTag: 'surplus bakery',
    pickupWindow: 'Today 17:30-18:30',
    address: 'Södermalm bakery cluster',
    latitude: 59.315,
    longitude: 18.073,
    priceLabel: '49 SEK',
    savingsLabel: 'Typical value 145 SEK'
  },
  {
    provider: 'Karma',
    title: 'Deli lunch boxes',
    surplusTag: 'prepared meals',
    pickupWindow: 'Today 15:00-16:00',
    address: 'Central station food hall',
    latitude: 59.331,
    longitude: 18.059,
    priceLabel: '59 SEK',
    savingsLabel: 'Typical value 129 SEK'
  },
  {
    provider: 'ResQ',
    title: 'Cafe salad and soup',
    surplusTag: 'same-day rescue',
    pickupWindow: 'Tomorrow 13:00-14:00',
    address: 'Nordic office district',
    latitude: 59.345,
    longitude: 18.085,
    priceLabel: '45 SEK',
    savingsLabel: 'Typical value 110 SEK'
  },
  {
    provider: 'Matsmart',
    title: 'Short-date pantry bundle',
    surplusTag: 'warehouse surplus',
    pickupWindow: 'Ships this week',
    address: 'Online surplus warehouse',
    latitude: 59.289,
    longitude: 18.021,
    priceLabel: '129 SEK',
    savingsLabel: 'Typical value 260 SEK'
  }
] as const;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;

  return routeMetadata({
    path: `/${country}/rescue`,
    title: 'Local food-waste rescue feed | GroceryView',
    description: 'Compare local surplus grocery pickup windows from Too Good To Go, Karma, ResQ, and Matsmart in one GroceryView feed.'
  });
}

export default async function RescueFeedPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const marketLabel = country.replace(/-/g, ' ');

  return (
    <PageShell>
      <Eyebrow>Food-waste rescue</Eyebrow>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Local surplus pickup feed</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            A {marketLabel} rescue view combining Too Good To Go, Karma, ResQ, and Matsmart-style surplus promos. Every card keeps the surplus tag, pickup window, and location visible before shoppers leave GroceryView.
          </p>
        </div>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Map view</p>
          <p className="mt-2 text-3xl font-black text-emerald-950">{rescueOffers.length} pickup options</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
            Pins below use provider pickup coordinates so shoppers can group rescue stops with their grocery trip.
          </p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden border-slate-200 bg-slate-950 text-white">
        <div className="grid gap-3 md:grid-cols-4">
          {rescueOffers.map((offer) => (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4" key={offer.provider}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">{offer.provider}</p>
              <p className="mt-2 text-lg font-black">{offer.title}</p>
              <p className="mt-2 rounded-full bg-emerald-300 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-950">{offer.surplusTag}</p>
              <p className="mt-3 text-sm font-semibold text-slate-200">{offer.address}</p>
              <p className="mt-1 text-xs font-bold text-slate-300">{offer.latitude.toFixed(3)}, {offer.longitude.toFixed(3)}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Surplus rescue offers">
        {rescueOffers.map((offer) => (
          <Card key={offer.title}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{offer.provider}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{offer.title}</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900">{offer.surplusTag}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="font-black text-slate-500">Pickup</dt>
                <dd className="mt-1 font-semibold text-slate-900">{offer.pickupWindow}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="font-black text-slate-500">Price</dt>
                <dd className="mt-1 font-semibold text-slate-900">{offer.priceLabel} · {offer.savingsLabel}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              Location: {offer.address}. Reserve in the provider app, then use the map coordinates above to plan pickup timing.
            </p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
