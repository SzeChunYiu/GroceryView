import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type CountryTerms = {
  code: 'SE' | 'NO' | 'DK' | 'FI' | 'IS';
  canonicalSlug: string;
  localSlug: string;
  label: string;
  currency: string;
  aliases: readonly string[];
};

const countryTerms = [
  { code: 'SE', canonicalSlug: 'sweden', localSlug: 'sverige', label: 'Sweden', currency: 'SEK', aliases: ['sweden', 'sverige', 'se'] },
  { code: 'NO', canonicalSlug: 'norway', localSlug: 'norge', label: 'Norway', currency: 'NOK', aliases: ['norway', 'norge', 'no'] },
  { code: 'DK', canonicalSlug: 'denmark', localSlug: 'danmark', label: 'Denmark', currency: 'DKK', aliases: ['denmark', 'danmark', 'dk'] },
  { code: 'FI', canonicalSlug: 'finland', localSlug: 'suomi', label: 'Finland', currency: 'EUR', aliases: ['finland', 'suomi', 'fi'] },
  { code: 'IS', canonicalSlug: 'iceland', localSlug: 'island', label: 'Iceland', currency: 'ISK', aliases: ['iceland', 'island', 'is'] }
] as const satisfies readonly CountryTerms[];

export function normalizeCountryTermsSlug(value: string): CountryTerms | null {
  const normalized = value.trim().toLowerCase();
  return countryTerms.find((country) => (country.aliases as readonly string[]).includes(normalized)) ?? null;
}

export function generateStaticParams() {
  return countryTerms.flatMap((country) => country.aliases.map((countryAlias) => ({ country: countryAlias })));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const normalized = normalizeCountryTermsSlug(country);
  if (!normalized) notFound();
  return {
    title: `${normalized.label} terms | GroceryView`,
    description: `Country terms and source-claim boundaries for GroceryView ${normalized.label}.`
  };
}

export default async function CountryTermsPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const normalized = normalizeCountryTermsSlug(country);
  if (!normalized) notFound();

  return (
    <PageShell>
      <Eyebrow>{normalized.code} terms</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{normalized.label} GroceryView terms</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This route accepts the canonical country slug, local country slug, and ISO alias for {normalized.label}. Unsupported country segments call <code className="rounded bg-slate-100 px-1 py-0.5">notFound()</code> instead of rendering generic terms.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Canonical slug" value={normalized.canonicalSlug} />
        <Metric label="Local slug" value={normalized.localSlug} />
        <Metric label="Currency" value={normalized.currency} />
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black tracking-tight">Accepted route aliases</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          All aliases below render the same country terms contract for {normalized.label}.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {normalized.aliases.map((alias) => (
            <code className="rounded-2xl bg-slate-100 p-4 text-sm font-black text-slate-900" key={alias}>/{alias}/terms</code>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Country-specific source claim boundary</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-bold leading-6 text-amber-950">
          <li>Prices, source coverage, and freshness claims must come from verified country-scoped rows.</li>
          <li>Currency-specific claims use {normalized.currency} only when source rows for {normalized.code} carry that currency.</li>
          <li>Branch price, stock, checkout, or loyalty claims stay blocked unless a connector explicitly provides that evidence.</li>
        </ul>
      </Card>
    </PageShell>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
