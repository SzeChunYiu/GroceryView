export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Integritet</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Integritetspolicy</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Denna policy förklarar hur GroceryView behandlar personuppgifter och vilka rättigheter du har enligt
            Dataskyddsförordningen (GDPR) och tillämplig svensk lag.
          </p>
        </div>
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Senast uppdaterad</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">24 maj 2026</p>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            Kort om vår hållning: vi lagrar så lite personuppgifter som möjligt och använder dataminimering som
            grundprincip.
          </p>
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PolicyCard
          title="1. Vilka uppgifter vi samlar in"
          details={[
            "E-postadress (konto), användarnamn och kontoinställningar.",
            "Receipts: kvitto-ID, butik, belopp, varor och tidsstämpel om du väljer att ladda upp dem.",
            "Loggar för säker drift: IP-adress vid inloggning, app-version och nödvändiga säkerhetshändelser.",
            "Cookies och lokal lagring för autentisering, sessionshantering och UX-preferenser.",
          ]}
        />
        <PolicyCard
          title="2. Rättslig grund"
          details={[
            "Art. 6.1 GDPR: avtalsgrund, berättigat intresse och rättslig förpliktelse där så krävs.",
            "Art. 9.2 GDPR: särskilda personkategorier behandlas inte i ordinarie flöden.",
            "Endast de uppgifter som behövs för tjänstens leverans behandlas.",
          ]}
        />
        <PolicyCard
          title="3. Lagring och delning"
          details={[
            "Vi säljer inte dina uppgifter till annonsnätverk eller marknadsföringsbyråer.",
            "Råa kvittobilder hålls åtskilda från prisfakta och gallras enligt interna bevarandefrister.",
            "Data lagras inom EU/EES där det är praktiskt möjligt; leverantörer styrs av personuppgiftsbiträdesavtal.",
            "Utlämning till tredje part sker endast när det är juridiskt nödvändigt eller nödvändigt för drift.",
          ]}
        />
        <PolicyCard
          title="4. Dina rättigheter"
          details={[
            "Rätt till tillgång (artikel 15), rättelse (16) och radering (17).",
            "Rätt att invända mot viss behandling (artikel 21) och begära begränsning (18).",
            "Du kan när som helst begära dataportabilitet (20) genom att kontakta vår support.",
            "Du kan göra klagomål till Integritetsskyddsmyndigheten vid bristande efterlevnad.",
          ]}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950">Kontakta oss</h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-zinc-950">Dataskyddsansvarig</p>
          <p className="mt-2 text-sm text-zinc-500">Mail: privacy@groceryview.se</p>
          <p className="text-sm text-zinc-500">Postadress: Exempelgatan 1, 111 22 Stockholm</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Vid personuppgiftsincident kontaktas ansvarig utan oskäligt dröjsmål i enlighet med 72-timmarskravet i artikel 33 GDPR.
          </p>
        </div>
      </section>
    </main>
  );
}

function PolicyCard({ title, details }: { title: string; details: string[] }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-zinc-600">
        {details.map((detail) => (
          <li className="list-disc pl-1" key={detail}>
            {detail}
          </li>
        ))}
      </ul>
    </article>
  );
}
