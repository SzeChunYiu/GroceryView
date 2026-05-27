import Link from 'next/link';
import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { topChainSpreads } from '@/lib/verified-data';

const countryAuthority = {
  iceland: {
    authority: 'Neytendastofa',
    countryLabel: 'Iceland',
    language: 'Icelandic/English',
    nextStep: 'Attach an Icelandic receipt or shelf-photo before submitting to Neytendastofa.'
  },
  norway: {
    authority: 'Forbrukerrådet',
    countryLabel: 'Norway',
    language: 'Norwegian/English',
    nextStep: 'Attach a Norwegian receipt or shelf-photo before submitting to Forbrukerrådet.'
  },
  sweden: {
    authority: 'Konsumentverket',
    countryLabel: 'Sweden',
    language: 'Swedish',
    nextStep: 'Attach the receipt and the advertised shelf/app price before submitting to Konsumentverket.'
  }
} as const;

type CountryKey = keyof typeof countryAuthority;

function authorityForCountry(country: string) {
  const key = country.toLowerCase() as CountryKey;
  return countryAuthority[key] ?? countryAuthority.sweden;
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function highestChainFor(product: (typeof topChainSpreads)[number]) {
  return Object.entries(product.chains)
    .filter((entry): entry is [string, { price: number; priceText: string; priceUnit: string; savings: number | null; url: string }] => typeof entry[1].price === 'number')
    .sort((left, right) => right[1].price - left[1].price)[0];
}

const complaintRows = topChainSpreads.slice(0, 3).flatMap((product) => {
  const highest = highestChainFor(product);
  if (!highest) return [];
  const [chargedChain, chargedRow] = highest;
  const overcharge = chargedRow.price - product.lowestPrice;
  if (overcharge <= 0) return [];

  return [{
    advertisedChain: product.lowestChain,
    advertisedPrice: product.lowestPrice,
    chargedChain,
    chargedPrice: chargedRow.price,
    code: product.code,
    overcharge,
    packageLabel: product.subline,
    productName: `${product.brand} ${product.name}`,
    sourceLabel: 'Axfood Willys/Hemköp observed price rows retrieved 2026-05-20/21'
  }];
});

function complaintTemplate(row: (typeof complaintRows)[number], authority: string) {
  return [
    `Till ${authority},`,
    '',
    `Här är beläggen för att butiken tog ${formatSek(row.overcharge)} mer än annonserat.`,
    `Produkt: ${row.productName} (${row.packageLabel}), artikelkod ${row.code}.`,
    `Annonserat/observerat pris: ${row.advertisedChain} ${formatSek(row.advertisedPrice)}.`,
    `Pris på kvitto eller i butik som ska kontrolleras: ${row.chargedChain} ${formatSek(row.chargedPrice)}.`,
    `Differens: ${formatSek(row.overcharge)}.`,
    `Källa: ${row.sourceLabel}.`,
    '',
    'Jag bifogar kvitto, datum/tid, butik och bild på hyllkant eller apppris. Använd inte mallen om kvittot inte visar samma produkt och butik.'
  ].join('\n');
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/complaint-helper`,
    title: 'Consumer complaint helper | GroceryView',
    description: 'Prefilled consumer authority complaint drafts backed by observed grocery price evidence.'
  });
}

export default async function ComplaintHelperPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const authority = authorityForCountry(country);

  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">{authority.authority}</StatusBadge>
            <StatusBadge tone="warning">Receipt required</StatusBadge>
          </>
        }
        eyebrow="Consumer complaint helper"
        title="Prefilled price complaint drafts from observed grocery evidence"
      >
        <p>
          Build a shopper-ready complaint for {authority.countryLabel} when a receipt shows a store charged more than an advertised price. GroceryView pre-fills product, price, and source evidence from observed rows, but the shopper must attach receipt and shelf/app proof before sending.
        </p>
      </DashboardHero>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Complaint helper guardrails">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Authority</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{authority.authority}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Draft language: {authority.language}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Evidence source</p>
          <p className="mt-2 text-2xl font-black text-emerald-800">{complaintRows.length} drafts</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Only real observed price rows; no synthetic charge amounts.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Before sending</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{authority.nextStep}</p>
        </Card>
      </section>

      <div className="mt-6 grid gap-5">
        {complaintRows.map((row) => (
          <Card className="overflow-hidden" key={row.code}>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <Eyebrow>Observed evidence</Eyebrow>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{row.productName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">{row.packageLabel} · {row.code}</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <p className="rounded-2xl bg-emerald-50 p-3 font-bold text-emerald-950">
                    Advertised/observed low: {row.advertisedChain} {formatSek(row.advertisedPrice)}
                  </p>
                  <p className="rounded-2xl bg-amber-50 p-3 font-bold text-amber-950">
                    Receipt/check price to verify: {row.chargedChain} {formatSek(row.chargedPrice)}
                  </p>
                  <p className="rounded-2xl bg-slate-50 p-3 font-black text-slate-950">
                    Potential difference: {formatSek(row.overcharge)}
                  </p>
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-slate-500">{row.sourceLabel}. Chain spread evidence is not a legal finding; it only pre-fills the complaint once the shopper has matching receipt proof.</p>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Prefilled template</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-950 p-4 text-sm font-semibold leading-6 text-white">
                  {complaintTemplate(row, authority.authority)}
                </pre>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <Eyebrow>Send safely</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-sky-950">
          This helper is not legal advice and does not submit anything automatically. Replace the receipt/check-price line with the shopper&apos;s actual receipt amount, attach the source image, then use the authority&apos;s official form.
        </p>
        <Link className="mt-4 inline-flex rounded-full bg-sky-900 px-4 py-2 text-sm font-black text-white" href={`/${country}/terms`}>
          View country terms and consumer authority notes
        </Link>
      </Card>
    </PageShell>
  );
}
