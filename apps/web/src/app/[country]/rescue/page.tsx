import { Card, Eyebrow, PageShell } from '@/components/data-ui';

const rescueFeeds = [
  {
    source: 'Too Good To Go',
    surplusTag: 'surplus',
    pickupWindow: 'Today 17:00–19:00',
    area: 'Central stores and cafés',
    countryCodes: ['se', 'no'],
    coordinates: '59.33,18.06',
    detail: 'Mystery bags from nearby grocery, bakery, café and convenience partners.'
  },
  {
    source: 'Karma',
    surplusTag: 'surplus',
    pickupWindow: 'Today 15:00–18:30',
    area: 'Urban grocery and restaurant counters',
    countryCodes: ['se'],
    coordinates: '59.31,18.08',
    detail: 'Discounted prepared food and grocery surplus with same-day pickup windows.'
  },
  {
    source: 'ResQ Club',
    surplusTag: 'surplus',
    pickupWindow: 'Today 16:00–20:00',
    area: 'Nordic city partners',
    countryCodes: ['se', 'no'],
    coordinates: '60.39,5.32',
    detail: 'Restaurant and retail rescue offers with explicit where-and-when pickup metadata.'
  },
  {
    source: 'Matsmart',
    surplusTag: 'surplus',
    pickupWindow: 'Ship-to-home',
    area: 'Online warehouse promos',
    countryCodes: ['se'],
    coordinates: 'warehouse',
    detail: 'Short-date and overstock grocery promotions surfaced as a non-pickup online rescue lane.'
  }
] as const;

export function generateStaticParams() {
  return [{ country: 'se' }, { country: 'no' }, { country: 'is' }];
}

export default async function RescueFeedPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const normalizedCountry = country.toLowerCase();
  const rows = rescueFeeds.filter((feed) => feed.countryCodes.some((code) => code === normalizedCountry));

  return (
    <PageShell>
      <Eyebrow>{normalizedCountry.toUpperCase()} rescue</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Local food-waste rescue feed</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-700">
        Combines Too Good To Go, Karma, ResQ and Matsmart surplus-tagged promos into one pickup-focused feed.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Map view</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Where + when to pick up</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Each card carries a surplus tag, pickup window, area label and map coordinate placeholder so the feed can plug into a real map provider later.
            </p>
          </div>
          <div className="relative min-h-[260px] overflow-hidden rounded-[2rem] bg-slate-950 p-4 text-white shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.45),transparent_28%),radial-gradient(circle_at_78%_58%,rgba(250,204,21,0.35),transparent_24%)]" />
            <div className="relative grid gap-3">
              {(rows.length > 0 ? rows : rescueFeeds).map((feed, index) => (
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur" key={feed.source}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">pin {index + 1} · {feed.coordinates}</p>
                  <p className="mt-1 text-lg font-black">{feed.source}</p>
                  <p className="text-sm font-semibold text-slate-200">{feed.area} · {feed.pickupWindow}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(rows.length > 0 ? rows : rescueFeeds).map((feed) => (
          <Card key={feed.source}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{feed.surplusTag}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{feed.source}</h2>
              </div>
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800">{feed.pickupWindow}</p>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">{feed.area}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{feed.detail}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
