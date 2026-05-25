import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type LegalKind = 'privacy' | 'cookies';
type LegalLocale = 'sv' | 'en';

type PolicySection = {
  title: string;
  body: string;
};

const privacySections: Record<LegalLocale, PolicySection[]> = {
  sv: [
    {
      title: 'Konto- och inköpsdata',
      body: 'Vi behandlar konto, hushåll, sparade varukorgar, bevakningar, butikspreferenser, aviseringar och lokala inställningar för att leverera prisjämförelser, budgetstöd och datarättigheter.'
    },
    {
      title: 'Kvitton och scannerunderlag',
      body: 'Uppladdade kvittobilder, OCR-rader och matchningsresultat används för historik, granskning och korrigering. Underlaget krypteras i lagring och behålls bara så länge det behövs för matchning, support eller lagstadgad revision innan det raderas eller anonymiseras.'
    },
    {
      title: 'Analys och annonser',
      body: 'Analys är frivillig och sammanställd. Annonslagring och ad-personalisering är nekade som standard; annonser förblir icke-personanpassade tills samtycke ges. Annonsunderlag redigeras så att kvitton, budgetar och direkt identifierande konto-ID inte skickas till annonsörer.'
    },
    {
      title: 'Lagring, radering och rättigheter',
      body: 'Kontoägare kan exportera data, rätta inställningar, invända mot annonsdata och begära radering. Radering omfattar konto, kvitton, varukorgar, bevakningar, prenumerationer och aviseringstokens efter signerad verifiering.'
    },
    {
      title: 'Personuppgiftsbiträden',
      body: 'Vi använder underleverantörer för hosting, databaser, objektlagring, OCR, e-post/push, betalning, analys och annonser. De får bara den data som behövs för tjänsten, omfattas av dataskyddsvillkor och får inte sälja GroceryView-kontodata.'
    }
  ],
  en: [
    {
      title: 'Account and shopping data',
      body: 'We process account, household, saved basket, watchlist, store preference, notification, and local settings data to provide price comparisons, budget support, and privacy rights workflows.'
    },
    {
      title: 'Receipts and scanner evidence',
      body: 'Uploaded receipt images, OCR rows, and matching results are used for history, review, and correction. Receipt evidence is encrypted at rest and retained only for matching, support, or required audit before deletion or anonymisation.'
    },
    {
      title: 'Analytics and ads',
      body: 'Analytics are optional and aggregated. Ad storage and ad personalisation are denied by default; ads remain non-personalised until consent is granted. Advertising payloads are redacted so receipts, budgets, and directly identifying account IDs are not shared with advertisers.'
    },
    {
      title: 'Retention, deletion, and rights',
      body: 'Account owners can export data, correct settings, object to ad data, and request deletion. Deletion covers account records, receipts, baskets, watchlists, subscriptions, and notification tokens after signed-in verification.'
    },
    {
      title: 'Processors',
      body: 'We use subprocessors for hosting, databases, object storage, OCR, email/push, payments, analytics, and ads. They receive only the data needed for the service, operate under data protection terms, and may not sell GroceryView account data.'
    }
  ]
};

const cookieSections: Record<LegalLocale, PolicySection[]> = {
  sv: [
    {
      title: 'Nödvändiga cookies',
      body: 'Krävs för säkerhet, språkval, session, samtyckesbevis, navigering och grundläggande kontroller. De är alltid aktiva eftersom tjänsten inte kan fungera säkert utan dem.'
    },
    {
      title: 'Analys',
      body: 'Frivilliga analyscookies mäter aggregerad produkt- och källtäckning, sökflöden och prestanda. De aktiveras först efter samtycke och ska inte innehålla råa kvitton eller privata varukorgsrader.'
    },
    {
      title: 'Annonser och personalisering',
      body: 'Ad storage, ad user data och ad personalisation är nekade som standard enligt Google Consent Mode v2. Personanpassade annonser eller rekommendationssignaler används bara när respektive kategori har valts.'
    },
    {
      title: 'Bevis, lagring och ändring',
      body: 'Samtyckesval sparas lokalt med policyVersion, tidpunkt, åtgärd och kategori. Du kan ändra valet via Cookie settings; en ny policyversion ber om samtycke igen.'
    }
  ],
  en: [
    {
      title: 'Necessary cookies',
      body: 'Required for security, language choice, session handling, consent proof, navigation, and core controls. They are always on because the service cannot operate safely without them.'
    },
    {
      title: 'Analytics',
      body: 'Optional analytics cookies measure aggregated product and source coverage, search funnels, and performance. They start only after consent and must not contain raw receipts or private basket rows.'
    },
    {
      title: 'Ads and personalisation',
      body: 'Ad storage, ad user data, and ad personalisation are denied by default under Google Consent Mode v2. Personalised ads or recommendation signals are used only when the relevant category is selected.'
    },
    {
      title: 'Proof, retention, and changes',
      body: 'Consent choices are stored locally with policyVersion, timestamp, action, and category state. You can change the choice through Cookie settings; a new policy version asks again.'
    }
  ]
};

const policyCopy = {
  sv: {
    privacy: {
      eyebrow: 'Integritetspolicy',
      title: 'GroceryViews integritetspolicy',
      intro: 'Den här svenska policyn förklarar vilka personuppgifter GroceryView behandlar, varför vi behandlar dem, hur länge de sparas och hur kontoägare kan exportera eller radera data.'
    },
    cookies: {
      eyebrow: 'Cookiepolicy',
      title: 'GroceryViews cookiepolicy',
      intro: 'Den här svenska cookiepolicyn beskriver nödvändiga cookies, frivillig analys, annonser, personalisering och hur samtycke sparas och kan ändras.'
    },
    alternateLabel: 'English version',
    accountCta: 'Öppna kontoinställningar',
    consentCta: 'Öppna cookieinställningar',
    updated: 'Senast uppdaterad 25 maj 2026'
  },
  en: {
    privacy: {
      eyebrow: 'Privacy policy',
      title: 'GroceryView privacy policy',
      intro: 'This English policy explains what personal data GroceryView processes, why we process it, how long it is retained, and how account owners can export or delete data.'
    },
    cookies: {
      eyebrow: 'Cookie policy',
      title: 'GroceryView cookie policy',
      intro: 'This English cookie policy explains necessary cookies, optional analytics, ads, personalisation, and how consent is stored and can be changed.'
    },
    alternateLabel: 'Svensk version',
    accountCta: 'Open account settings',
    consentCta: 'Open cookie settings',
    updated: 'Last updated May 25, 2026'
  }
} as const;

export function LegalPolicyPage({ kind, locale }: Readonly<{ kind: LegalKind; locale: LegalLocale }>) {
  const copy = policyCopy[locale][kind];
  const sections = kind === 'privacy' ? privacySections[locale] : cookieSections[locale];
  const alternateLocale = locale === 'sv' ? 'en' : 'sv';

  return (
    <PageShell>
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{copy.title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{copy.intro}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-black text-emerald-800">
        <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href={`/${alternateLocale}/${kind}`}>
          {policyCopy[locale].alternateLabel}
        </Link>
        <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/settings">
          {policyCopy[locale].accountCta}
        </Link>
        <Link className="rounded-full bg-white px-4 py-2 shadow-sm underline decoration-emerald-300 underline-offset-4" href="/cookies">
          {policyCopy[locale].consentCta}
        </Link>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-600">{policyCopy[locale].updated}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <Card className="border-emerald-200" key={section.title}>
            <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{section.body}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
