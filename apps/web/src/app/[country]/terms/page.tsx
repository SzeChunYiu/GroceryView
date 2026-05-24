import { Card, PageShell } from '@/components/data-ui';

type CountryCode = 'se' | 'no' | 'is';

type CountryTerms = {
  country: CountryCode;
  name: string;
  languageLabel: string;
  consumerAuthority: string;
  consumerLaw: string;
  disputeBody: string;
  currency: string;
  clauses: readonly string[];
};

const countryTerms: Record<CountryCode, CountryTerms> = {
  se: {
    country: 'se',
    name: 'Sweden',
    languageLabel: 'Svenska villkor',
    consumerAuthority: 'Konsumentverket and Allmänna reklamationsnämnden (ARN)',
    consumerLaw: 'Konsumentköplagen and Distansavtalslagen where GroceryView offers consumer-facing digital services.',
    disputeBody: 'ARN or the competent Swedish court when mandatory consumer rules require it.',
    currency: 'SEK',
    clauses: [
      'Prices, savings estimates, and availability are informational snapshots and do not replace the store receipt, shelf label, or checkout total.',
      'Consumers keep all non-waivable rights under Swedish consumer protection law, including complaint rights for paid digital services.',
      'Support and legal notices may be provided in Swedish or English for Swedish users.'
    ]
  },
  no: {
    country: 'no',
    name: 'Norway',
    languageLabel: 'Norske vilkår',
    consumerAuthority: 'Forbrukertilsynet and Forbrukerrådet',
    consumerLaw: 'Forbrukerkjøpsloven, angrerettloven, and other mandatory Norwegian consumer rules when applicable.',
    disputeBody: 'Forbrukerklageutvalget or the competent Norwegian venue where mandatory law applies.',
    currency: 'NOK',
    clauses: [
      'GroceryView price comparisons are guidance only; the binding price is the retailer checkout or receipt price.',
      'Nothing in these terms limits mandatory rights under Forbrukerkjøpsloven for Norwegian consumers.',
      'Norwegian users may contact support in Norwegian or English for account, subscription, and complaint questions.'
    ]
  },
  is: {
    country: 'is',
    name: 'Iceland',
    languageLabel: 'Íslenskir skilmálar',
    consumerAuthority: 'Neytendastofa',
    consumerLaw: 'Icelandic consumer purchase, distance-selling, marketing, and digital-service consumer protection rules where applicable.',
    disputeBody: 'The relevant Icelandic consumer complaints body or competent Icelandic court when mandatory law applies.',
    currency: 'ISK',
    clauses: [
      'Displayed grocery prices and basket savings are estimates for comparison and may differ from the retailer checkout price.',
      'Icelandic consumers retain mandatory statutory rights that cannot be waived by these terms.',
      'Marketing, price display, and consumer information practices are intended to align with Neytendastofa expectations.'
    ]
  }
} as const;

const fallbackCountry: CountryCode = 'se';

function getCountryTerms(country?: string): CountryTerms {
  const normalized = country?.toLowerCase();
  if (normalized === 'no' || normalized === 'is' || normalized === 'se') {
    return countryTerms[normalized];
  }
  return countryTerms[fallbackCountry];
}

export function generateStaticParams() {
  return Object.keys(countryTerms).map((country) => ({ country }));
}

export function generateMetadata({ params }: { params: { country: string } }) {
  const terms = getCountryTerms(params.country);
  return {
    title: `Terms of service | GroceryView ${terms.name}`,
    description: `Country-specific GroceryView terms for ${terms.name}, including local consumer protection clauses and complaint references.`
  };
}

export default function CountryTermsPage({ params }: { params: { country: string } }) {
  const terms = getCountryTerms(params.country);

  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Terms of service / {terms.languageLabel}</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">GroceryView terms for {terms.name}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        These country-specific terms supplement the general GroceryView service terms for users in {terms.name}. They call out local consumer-protection rules, complaint channels, and price-display expectations for the Nordic launch.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-2xl font-black text-slate-950">Country-specific consumer clauses</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-700">
            {terms.clauses.map((clause) => (
              <li key={clause}>{clause}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-slate-950">Local legal references</h2>
          <dl className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
            <div>
              <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Consumer authority</dt>
              <dd className="mt-1">{terms.consumerAuthority}</dd>
            </div>
            <div>
              <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Consumer protection law</dt>
              <dd className="mt-1">{terms.consumerLaw}</dd>
            </div>
            <div>
              <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Dispute venue</dt>
              <dd className="mt-1">{terms.disputeBody}</dd>
            </div>
            <div>
              <dt className="font-black uppercase tracking-[0.14em] text-slate-500">Displayed currency</dt>
              <dd className="mt-1">{terms.currency}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </PageShell>
  );
}
