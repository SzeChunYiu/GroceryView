export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Villkor</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Användarvillkor</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Genom att använda GroceryView godkänner du dessa villkor för tjänsten, inklusive hur innehåll, data och
            kontoansvar hanteras.
          </p>
        </div>
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Version</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">24 maj 2026</p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Gäller för alla användare av webbtjänsten i demo- och produktionsmiljö.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TermsCard
          title="1. Tjänstens omfattning"
          details={[
            "Tjänsten tillhandahålls i befintligt skick för informations- och planeringsändamål.",
            "Viss data kan visa uppskattade eller verifierade priser beroende på källa och senast observerad tidpunkt.",
            "Innehåll får ändras när nya datakällor publiceras.",
          ]}
        />
        <TermsCard
          title="2. Konto och åtkomst"
          details={[
            "Du ansvarar för att dina inloggningsuppgifter hålls säkra.",
            "Missbruk, automatiserad skrapning och otillåten åtkomst blockeras och kan leda till avstängning.",
            "Vi kan tillfälligt stänga konton vid rättsbrott eller säkerhetsrisker.",
          ]}
        />
        <TermsCard
          title="3. Prisdatas trovärdighet"
          details={[
            "Vi strävar efter korrekthet men kan inte garantera fullständig aktualitet för varje produkt.",
            "GroceryView ansvarar inte för individuella inköpsbeslut baserade enbart på visad information.",
            "Priser kan avvika från butikens faktiska pris på grund av kampanjer, medlemmar, skatter eller lagersituation.",
          ]}
        />
        <TermsCard
          title="4. Ansvarsbegränsning"
          details={[
            "Tjänsten tillhandahålls utan dröjsmål, men utan garanti för avbrottsfri tillgång.",
            "Vi ansvarar inte för indirekta skador, utebliven vinst eller förlust av affärsmöjligheter.",
            "Tillämplig lag är svensk rätt och tvister behandlas i första hand i Stockholm domsaga.",
          ]}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950">Kontakt</h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-zinc-950">Frågor om villkoren</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Skicka frågor till legal@groceryview.se.</p>
          <p className="mt-2 text-sm text-zinc-500">Om villkoren ändras publiceras version och ikraftträdandedatum här.</p>
        </div>
      </section>
    </main>
  );
}

function TermsCard({ title, details }: { title: string; details: string[] }) {
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
