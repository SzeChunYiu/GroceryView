type CountryCode = 'se' | 'no' | 'is';

type ComplaintAuthority = {
  country: CountryCode;
  name: string;
  countryName: string;
  filingUrl: string;
  language: string;
  template: (evidence: ObservationEvidence) => string;
};

type ObservationEvidence = {
  storeName: string;
  productName: string;
  advertisedPrice: string;
  chargedPrice: string;
  difference: string;
  observedAt: string;
  evidenceUrl: string;
};

const demoEvidence: Record<CountryCode, ObservationEvidence> = {
  se: {
    storeName: 'ICA Nära Sergels torg',
    productName: 'Mjölk 3% 1 liter',
    advertisedPrice: '18,90 kr',
    chargedPrice: '24,90 kr',
    difference: '6,00 kr',
    observedAt: '2026-05-24 12:14',
    evidenceUrl: 'https://groceryview.example/evidence/se/price-observation-ica-mjolk'
  },
  no: {
    storeName: 'REMA 1000 Storgata',
    productName: 'Brød grovt 750 g',
    advertisedPrice: '32,90 kr',
    chargedPrice: '39,90 kr',
    difference: '7,00 kr',
    observedAt: '2026-05-24 12:14',
    evidenceUrl: 'https://groceryview.example/evidence/no/price-observation-rema-brod'
  },
  is: {
    storeName: 'Krónan Grandi',
    productName: 'Mjólk 1 l',
    advertisedPrice: '219 kr.',
    chargedPrice: '269 kr.',
    difference: '50 kr.',
    observedAt: '2026-05-24 12:14',
    evidenceUrl: 'https://groceryview.example/evidence/is/price-observation-kronan-mjolk'
  }
};

const authorities: Record<CountryCode, ComplaintAuthority> = {
  se: {
    country: 'se',
    name: 'Konsumentverket',
    countryName: 'Sverige',
    filingUrl: 'https://www.konsumentverket.se/for-konsument/anmal-till-konsumentverket/',
    language: 'svenska',
    template: (evidence) => `Hej Konsumentverket,

Här är beläggen för att butiken tog ${evidence.difference} mer än annonserat.

Butik: ${evidence.storeName}
Vara: ${evidence.productName}
Annonserat pris: ${evidence.advertisedPrice}
Debiterat pris: ${evidence.chargedPrice}
Skillnad: ${evidence.difference}
Observationstid: ${evidence.observedAt}
Underlag: ${evidence.evidenceUrl}

Jag vill att ärendet granskas eftersom priset vid köp inte matchade det annonserade pris som GroceryView observerade.`
  },
  no: {
    country: 'no',
    name: 'Forbrukerrådet',
    countryName: 'Norge',
    filingUrl: 'https://www.forbrukerradet.no/forside/klage/',
    language: 'norsk',
    template: (evidence) => `Hei Forbrukerrådet,

Her er dokumentasjonen på at butikken tok ${evidence.difference} mer enn annonsert.

Butikk: ${evidence.storeName}
Vare: ${evidence.productName}
Annonsert pris: ${evidence.advertisedPrice}
Belastet pris: ${evidence.chargedPrice}
Forskjell: ${evidence.difference}
Observasjonstidspunkt: ${evidence.observedAt}
Dokumentasjon: ${evidence.evidenceUrl}

Jeg ber om veiledning fordi prisen ved kjøp ikke samsvarte med den annonserte prisen GroceryView observerte.`
  },
  is: {
    country: 'is',
    name: 'Neytendastofa',
    countryName: 'Ísland',
    filingUrl: 'https://www.neytendastofa.is/',
    language: 'íslenska',
    template: (evidence) => `Góðan dag Neytendastofa,

Hér eru gögnin sem sýna að verslunin rukkaði ${evidence.difference} meira en auglýst var.

Verslun: ${evidence.storeName}
Vara: ${evidence.productName}
Auglýst verð: ${evidence.advertisedPrice}
Rukkað verð: ${evidence.chargedPrice}
Mismunur: ${evidence.difference}
Tími athugunar: ${evidence.observedAt}
Gögn: ${evidence.evidenceUrl}

Ég óska eftir að málið verði skoðað þar sem verðið við kaup samræmdist ekki auglýstu verði sem GroceryView skráði.`
  }
};

export function generateStaticParams() {
  return Object.keys(authorities).map((country) => ({ country }));
}

function countryFromParam(country: string | undefined): CountryCode {
  return country === 'no' || country === 'is' ? country : 'se';
}

export default async function ComplaintHelperPage({ params }: Readonly<{ params: Promise<{ country?: string }> | { country?: string } }>) {
  const resolvedParams = await params;
  const country = countryFromParam(resolvedParams.country);
  const authority = authorities[country];
  const evidence = demoEvidence[country];
  const template = authority.template(evidence);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-slate-900">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Consumer complaint helper</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Pre-filled price complaint for {authority.countryName}</h1>
      <p className="mt-4 text-lg text-slate-700">
        Use GroceryView observation evidence to explain that a store charged more than the advertised price.
        The template is addressed to {authority.name} and written in {authority.language}.
      </p>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <EvidenceRow label="Store" value={evidence.storeName} />
          <EvidenceRow label="Product" value={evidence.productName} />
          <EvidenceRow label="Advertised" value={evidence.advertisedPrice} />
          <EvidenceRow label="Charged" value={evidence.chargedPrice} />
          <EvidenceRow label="Difference" value={evidence.difference} />
          <EvidenceRow label="Observed" value={evidence.observedAt} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <label className="text-sm font-black uppercase tracking-[0.18em] text-emerald-900" htmlFor="complaint-template">
          Copy-ready complaint template
        </label>
        <textarea
          className="mt-3 min-h-96 w-full rounded-2xl border border-emerald-200 bg-white p-4 font-mono text-sm leading-6 text-slate-900"
          id="complaint-template"
          readOnly
          value={template}
        />
        <a className="mt-4 inline-flex rounded-full bg-emerald-700 px-5 py-3 font-black text-white" href={authority.filingUrl} rel="noreferrer" target="_blank">
          Open {authority.name}
        </a>
      </section>
    </main>
  );
}

function EvidenceRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}
