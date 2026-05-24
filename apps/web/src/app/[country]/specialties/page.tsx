import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type CountryCode = 'se' | 'no' | 'is';

type Specialty = {
  name: string;
  description: string;
  lookFor: string[];
  stores: Array<{ chain: string; where: string; confidence: 'common' | 'selected stores' | 'seasonal' }>;
};

const countrySpecialties: Record<CountryCode, { countryName: string; visitorCopy: string; specialties: Specialty[] }> = {
  se: {
    countryName: 'Sweden',
    visitorCopy: 'Tourist mode highlights Swedish staples that visitors often want to try, with store chains where they are commonly found.',
    specialties: [
      {
        name: 'Kalles kaviar',
        description: 'Smoked cod roe spread sold in the blue-and-yellow tube, usually eaten with eggs, crispbread, or breakfast sandwiches.',
        lookFor: ['kaviar', 'Kalles Original', 'tube near chilled fish/cheese'],
        stores: [
          { chain: 'ICA', where: 'chilled spreads or breakfast aisle', confidence: 'common' },
          { chain: 'Coop', where: 'kaviar / pålägg shelf', confidence: 'common' },
          { chain: 'Hemköp', where: 'refrigerated sandwich toppings', confidence: 'common' }
        ]
      },
      {
        name: 'Marabou chocolate',
        description: 'Classic Swedish milk chocolate bars, including Mjölkchoklad, Daim, and Schweizernöt varieties.',
        lookFor: ['Marabou', 'Mjölkchoklad', '200 g chocolate bars'],
        stores: [
          { chain: 'Willys', where: 'candy/chocolate aisle', confidence: 'common' },
          { chain: 'ICA', where: 'confectionery aisle and checkout campaigns', confidence: 'common' },
          { chain: 'Lidl', where: 'selected Swedish candy assortment', confidence: 'selected stores' }
        ]
      }
    ]
  },
  no: {
    countryName: 'Norway',
    visitorCopy: 'Norwegian specialties lean dairy-heavy and chocolate-forward; availability varies by city but major chains are the first stops.',
    specialties: [
      {
        name: 'Brunost',
        description: 'Brown whey cheese with caramel notes, sliced thinly for bread, waffles, or crispbread.',
        lookFor: ['brunost', 'Gudbrandsdalsost', 'fløtemysost'],
        stores: [
          { chain: 'Kiwi', where: 'cheese cooler', confidence: 'common' },
          { chain: 'Meny', where: 'cheese counter and dairy case', confidence: 'common' },
          { chain: 'Rema 1000', where: 'everyday cheese shelf', confidence: 'common' }
        ]
      },
      {
        name: 'Freia chocolate',
        description: 'Norwegian chocolate brand known for Melkesjokolade and Kvikk Lunsj hiking bars.',
        lookFor: ['Freia', 'Melkesjokolade', 'Kvikk Lunsj'],
        stores: [
          { chain: 'Coop Obs', where: 'large candy aisle', confidence: 'common' },
          { chain: 'Meny', where: 'confectionery aisle', confidence: 'common' },
          { chain: 'Narvesen', where: 'grab-and-go chocolate near tills', confidence: 'selected stores' }
        ]
      }
    ]
  },
  is: {
    countryName: 'Iceland',
    visitorCopy: 'Icelandic visitor staples are easiest to find in full-size supermarkets; convenience stores may carry smaller packs.',
    specialties: [
      {
        name: 'Skyr',
        description: 'Thick cultured dairy, eaten like yogurt and sold plain or flavoured in tubs and single-serve cups.',
        lookFor: ['skyr', 'Ísey', 'plain or vanilla cups'],
        stores: [
          { chain: 'Krónan', where: 'dairy cooler', confidence: 'common' },
          { chain: 'Bónus', where: 'refrigerated dairy wall', confidence: 'common' },
          { chain: 'Hagkaup', where: 'larger dairy assortment', confidence: 'common' }
        ]
      },
      {
        name: 'Harðfiskur',
        description: 'Dried fish snack often eaten with butter; usually sold in bags near fish, snacks, or local specialty shelves.',
        lookFor: ['harðfiskur', 'dried fish', 'fish jerky bags'],
        stores: [
          { chain: 'Krónan', where: 'local food or fish section', confidence: 'selected stores' },
          { chain: 'Hagkaup', where: 'Icelandic specialties shelf', confidence: 'common' },
          { chain: '10-11', where: 'tourist snack assortment', confidence: 'seasonal' }
        ]
      }
    ]
  }
};

export function generateStaticParams() {
  return Object.keys(countrySpecialties).map((country) => ({ country }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const page = countrySpecialties[country.toLowerCase() as CountryCode];
  if (!page) return { title: 'Tourist specialties | GroceryView' };
  return {
    title: `${page.countryName} specialties | GroceryView`,
    description: `Tourist grocery guide for regional specialties in ${page.countryName}.`
  };
}

export default async function CountrySpecialtiesPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const page = countrySpecialties[country.toLowerCase() as CountryCode];
  if (!page) notFound();

  return (
    <PageShell>
      <Eyebrow>Tourist mode</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{page.countryName} specialties and where to find them</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{page.visitorCopy}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {page.specialties.map((specialty) => (
          <Card key={specialty.name}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Regional product</p>
            <h2 className="mt-2 text-2xl font-black">{specialty.name}</h2>
            <p className="mt-3 leading-7 text-slate-700">{specialty.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {specialty.lookFor.map((term) => (
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-900" key={term}>{term}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {specialty.stores.map((store) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${specialty.name}-${store.chain}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-lg font-black">{store.chain}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-600">{store.confidence}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Look around: {store.where}.</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-xl font-black text-amber-950">Availability note</h2>
        <p className="mt-3 leading-7 text-amber-950">
          Tourist mode is a curated guide, not a live stock guarantee. Use it to pick likely chains, then verify current stock and prices in the store or catalogue.
        </p>
        <Link className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" href="/stores">
          Open store directory
        </Link>
      </Card>
    </PageShell>
  );
}
