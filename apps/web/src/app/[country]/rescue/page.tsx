type RescuePageProps = {
  params: Promise<{ country: string }>;
};

const rescuePromos = [
  {
    provider: 'Too Good To Go',
    title: 'Bakery surprise bag',
    pickup: '17:30-18:30',
    area: 'Central pickup',
    lat: 59.334,
    lng: 18.063,
    price: '49 kr',
    surplusTag: 'surplus'
  },
  {
    provider: 'Karma',
    title: 'Ready meal rescue',
    pickup: '15:00-19:00',
    area: 'Restaurant counter',
    lat: 59.329,
    lng: 18.071,
    price: '59 kr',
    surplusTag: 'surplus'
  },
  {
    provider: 'ResQ',
    title: 'Cafe lunch box',
    pickup: '14:00-16:00',
    area: 'Neighbourhood cafe',
    lat: 59.317,
    lng: 18.055,
    price: '69 kr',
    surplusTag: 'surplus'
  },
  {
    provider: 'Matsmart',
    title: 'Short-date pantry bundle',
    pickup: 'Delivery window',
    area: 'Home delivery',
    lat: 59.351,
    lng: 18.02,
    price: '99 kr',
    surplusTag: 'surplus'
  }
];

export async function generateMetadata({ params }: RescuePageProps) {
  const { country } = await params;
  return {
    title: `${country.toUpperCase()} food-waste rescue feed`,
    description: 'Surplus offers from Too Good To Go, Karma, ResQ, and Matsmart with pickup windows.'
  };
}

export default async function RescueFeedPage({ params }: RescuePageProps) {
  const { country } = await params;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{country.toUpperCase()} · surplus</p>
        <h1 className="text-3xl font-bold text-slate-950">Local food-waste rescue feed</h1>
        <p className="max-w-3xl text-slate-700">
          Compare pickup-ready surplus promos from Too Good To Go, Karma, ResQ, and Matsmart in one local feed.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {rescuePromos.map((promo) => (
          <article key={promo.provider} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">{promo.provider}</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-800">
                {promo.surplusTag}
              </span>
            </div>
            <p className="mt-3 text-lg font-medium text-slate-900">{promo.title}</p>
            <dl className="mt-4 grid gap-2 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <dt>Pickup</dt>
                <dd className="font-medium text-slate-950">{promo.pickup}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Where</dt>
                <dd className="font-medium text-slate-950">{promo.area}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Promo price</dt>
                <dd className="font-medium text-slate-950">{promo.price}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-semibold text-slate-950">Pickup map view</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {rescuePromos.map((promo) => (
            <div key={`${promo.provider}-map`} className="rounded-xl bg-white p-4 text-sm shadow-sm">
              <p className="font-semibold text-slate-950">{promo.provider}</p>
              <p className="text-slate-700">{promo.area}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                {promo.lat.toFixed(3)}, {promo.lng.toFixed(3)} · {promo.pickup}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
