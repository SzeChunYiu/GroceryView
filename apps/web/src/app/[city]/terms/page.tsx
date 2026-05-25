import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type CountryTerms = {
  slug: string;
  countryName: string;
  marketLabel: string;
  currency: string;
  consumerAuthority: string;
  complaintBody: string;
  lawReferences: readonly string[];
  authorityUrl: string;
  complaintUrl: string;
  cancellationLabel: string;
  defectiveGoodsLabel: string;
  localClause: string;
};

const countryTerms = [
  {
    slug: 'sweden',
    countryName: 'Sweden',
    marketLabel: 'Sverige',
    currency: 'SEK',
    consumerAuthority: 'Konsumentverket',
    complaintBody: 'Allmänna reklamationsnämnden',
    lawReferences: ['Konsumentköplagen', 'Distansavtalslagen', 'Marknadsföringslagen'],
    authorityUrl: 'https://www.konsumentverket.se/',
    complaintUrl: 'https://www.arn.se/',
    cancellationLabel: 'Distance purchase withdrawal rights apply where GroceryView is the seller of a paid digital service.',
    defectiveGoodsLabel: 'Mandatory Swedish consumer remedies are not limited by these terms.',
    localClause:
      'Swedish shoppers keep mandatory rights for misleading pricing, digital service defects, and complaint handling. GroceryView does not remove statutory rights by labelling price rows as source-backed estimates.'
  },
  {
    slug: 'norway',
    countryName: 'Norway',
    marketLabel: 'Norge',
    currency: 'NOK',
    consumerAuthority: 'Forbrukertilsynet',
    complaintBody: 'Forbrukerradet',
    lawReferences: ['Forbrukerkjøpsloven', 'Angrerettloven', 'Markedsføringsloven', 'Ehandelsloven'],
    authorityUrl: 'https://www.forbrukertilsynet.no/english/guidelines/standard-sales-conditions-consumer-purchases-of-goods-the-internet',
    complaintUrl: 'https://www.forbrukerradet.no/',
    cancellationLabel: 'Norwegian cancellation rules are preserved for paid digital services when they apply.',
    defectiveGoodsLabel: 'Forbrukerkjøpsloven remedies control consumer purchases and cannot be waived by these terms.',
    localClause:
      'For Norway, these terms are read together with Forbrukerkjøpsloven and the Consumer Authority standard sales conditions for internet purchases. If GroceryView sells a paid digital service to a Norwegian consumer, mandatory Norwegian protections override any conflicting platform wording.'
  },
  {
    slug: 'denmark',
    countryName: 'Denmark',
    marketLabel: 'Danmark',
    currency: 'DKK',
    consumerAuthority: 'Forbrugerombudsmanden',
    complaintBody: 'Nævnenes Hus',
    lawReferences: ['Købeloven', 'Forbrugeraftaleloven', 'Markedsføringsloven'],
    authorityUrl: 'https://www.forbrugerombudsmanden.dk/',
    complaintUrl: 'https://naevneneshus.dk/',
    cancellationLabel: 'Danish distance-contract withdrawal rights apply where required.',
    defectiveGoodsLabel: 'Danish mandatory consumer remedies apply to paid GroceryView services.',
    localClause:
      'Danish consumers keep non-waivable rights for clear price information, fair marketing, and complaint handling. GroceryView price intelligence is informational unless a paid service order states otherwise.'
  },
  {
    slug: 'finland',
    countryName: 'Finland',
    marketLabel: 'Suomi',
    currency: 'EUR',
    consumerAuthority: 'Finnish Competition and Consumer Authority',
    complaintBody: 'Consumer Disputes Board',
    lawReferences: ['Kuluttajansuojalaki', 'Laki sopimattomasta menettelysta elinkeinotoiminnassa'],
    authorityUrl: 'https://www.kkv.fi/en/consumer-affairs/',
    complaintUrl: 'https://www.kuluttajariita.fi/en/',
    cancellationLabel: 'Finnish distance-selling cancellation rules apply where GroceryView sells a paid digital service.',
    defectiveGoodsLabel: 'Finnish statutory defect and complaint rights are preserved.',
    localClause:
      'Finnish consumers retain mandatory protections for digital service quality, marketing, and complaint escalation. Any service-specific order terms must be read with Kuluttajansuojalaki.'
  },
  {
    slug: 'iceland',
    countryName: 'Iceland',
    marketLabel: 'Island',
    currency: 'ISK',
    consumerAuthority: 'Neytendastofa',
    complaintBody: 'Kærunefnd vöru- og þjónustukaupa',
    lawReferences: ['Neytendakaup', 'Act on Consumer Contracts', 'Act on Supervision of Unfair Commercial Practices'],
    authorityUrl: 'https://www.neytendastofa.is/english/consumer-rights-divison/',
    complaintUrl: 'https://kvth.is/',
    cancellationLabel: 'Icelandic distance-contract cancellation rights apply where mandatory law requires them.',
    defectiveGoodsLabel: 'Icelandic consumer purchase and service remedies are not narrowed by these terms.',
    localClause:
      'For Iceland, consumer notices may be escalated through Neytendastofa where its consumer-rights remit applies, and disputes about goods or services may be directed to the Complaints Committee for Goods and Services. GroceryView will not rely on these terms to reduce non-waivable Icelandic protections.'
  }
] as const satisfies readonly CountryTerms[];

function findCountryTerms(country: string) {
  return countryTerms.find((entry) => entry.slug === country.toLowerCase());
}

export function generateStaticParams() {
  return countryTerms.map((entry) => ({ city: entry.slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ city: string }> }>) {
  const { city: country } = await params;
  const terms = findCountryTerms(country);
  if (!terms) notFound();

  return routeMetadata({
    path: `/${terms.slug}/terms`,
    title: `${terms.countryName} terms of service | GroceryView`,
    description: `Country-specific GroceryView terms for ${terms.countryName}, including consumer protection references, cancellation rights, complaint routes, and mandatory local law safeguards.`
  });
}

export default async function CountryTermsPage({ params }: Readonly<{ params: Promise<{ city: string }> }>) {
  const { city: country } = await params;
  const terms = findCountryTerms(country);
  if (!terms) notFound();

  return (
    <PageShell>
      <Eyebrow>Terms of service</Eyebrow>
      <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">{terms.countryName} terms and consumer rights</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            These country terms apply when GroceryView is offered to consumers in {terms.marketLabel}. They supplement the general platform terms and preserve mandatory consumer protection rules in {terms.countryName}.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-900">
          Billing currency: {terms.currency}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <h2 className="text-2xl font-black text-slate-950">Country-specific clause</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{terms.localClause}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Cancellation</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{terms.cancellationLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Defects and complaints</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{terms.defectiveGoodsLabel}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-slate-950">Mandatory-law references</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {terms.lawReferences.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
          <div className="mt-5 grid gap-3">
            <a className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={terms.authorityUrl}>
              {terms.consumerAuthority}
            </a>
            <a className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={terms.complaintUrl}>
              {terms.complaintBody}
            </a>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">GroceryView service boundaries</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-base font-black text-slate-950">Price information</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              GroceryView compares source-backed grocery prices. Retailers remain responsible for the checkout price, availability, delivery, substitutions, and product safety of groceries bought from them.
            </p>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950">Paid services</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              If a paid GroceryView subscription or digital service is offered in {terms.countryName}, the order flow must show the price, renewal terms, cancellation route, and support contact before purchase.
            </p>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950">Support route</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Consumers should contact GroceryView support first for platform issues. Nothing in these terms prevents escalation to {terms.consumerAuthority} or {terms.complaintBody} where local law permits it.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
