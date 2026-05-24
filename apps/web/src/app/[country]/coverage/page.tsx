import { notFound } from 'next/navigation';

const supportedCountries = ['SE', 'NO', 'IS'] as const;
type CountryCode = typeof supportedCountries[number];

type ChainConfidence = {
  chain: string;
  confidence: 'verified' | 'partial' | 'unavailable';
  note: string;
};

type CountryCoverage = {
  chains: number;
  countryName: string;
  lastUpdate: string | null;
  perChainConfidence: ChainConfidence[];
  skus: number;
  stores: number;
};

const coverageByCountry: Record<CountryCode, CountryCoverage> = {
  SE: { chains: 0, countryName: 'Sweden', lastUpdate: null, perChainConfidence: [], skus: 0, stores: 0 },
  NO: { chains: 0, countryName: 'Norway', lastUpdate: null, perChainConfidence: [], skus: 0, stores: 0 },
  IS: { chains: 0, countryName: 'Iceland', lastUpdate: null, perChainConfidence: [], skus: 0, stores: 0 }
};

function parseCountry(country: string): CountryCode | null {
  const normalized = country.toUpperCase();
  return supportedCountries.includes(normalized as CountryCode) ? normalized as CountryCode : null;
}

export function generateStaticParams() {
  return supportedCountries.map((country) => ({ country: country.toLowerCase() }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const countryCode = parseCountry(country);
  if (!countryCode) notFound();
  return {
    title: `${coverageByCountry[countryCode].countryName} coverage | GroceryView`,
    description: `Honest GroceryView public coverage stats for ${coverageByCountry[countryCode].countryName}.`
  };
}

export default async function CountryCoveragePage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const countryCode = parseCountry(country);
  if (!countryCode) notFound();
  const coverage = coverageByCountry[countryCode];
  const lastUpdate = coverage.lastUpdate ?? 'unavailable';

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-[#f5f1e8] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Public country coverage</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">{coverage.countryName} coverage</h1>
      <p className="mt-4 rounded-3xl border border-emerald-200 bg-white p-5 text-lg font-bold leading-8 shadow-sm">
        We track {coverage.chains} chains, {coverage.stores} stores, {coverage.skus} skus in {coverage.countryName}. Last update {lastUpdate}.
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">
        No fabricated coverage claims: this page only publishes country-scoped counts after a verified coverage feed is available for that country.
      </p>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight">Confidence per chain</h2>
        {coverage.perChainConfidence.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {coverage.perChainConfidence.map((row) => (
              <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.chain}>
                <p className="font-black text-slate-950">{row.chain}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">{row.confidence}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{row.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
            No verified chain-level confidence rows are published for {coverage.countryName} yet.
          </p>
        )}
      </section>
    </main>
  );
}
