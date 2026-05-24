export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Villkor</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Användarvillkor</h1>
      <p className="mt-3 text-sm text-zinc-500">Senast uppdaterad: 24 maj 2026</p>

      <section className="mt-8 grid gap-6 rounded-lg border border-zinc-200 bg-white p-6">
        <article>
          <h2 className="text-lg font-semibold text-zinc-950">1. Vem vi är</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            GroceryView är en pris- och budgettjänst för hushåll i Sverige. Genom att använda tjänsten godkänner du dessa villkor samt tillämplig
            svensk konsumenträtt och lagar för elektroniska tjänster.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">2. Tillåten användning</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-zinc-600">
            <li>Använd kontot enligt syftet – prisjämförelse, budget och kvittohantering.</li>
            <li>Ladda inte upp material som inte avser köp i dagligvarukedjor eller som bryter mot lagar.</li>
            <li>Säkerställ att du har rätt att dela de uppgifter du lägger till i tjänsten.</li>
          </ul>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">3. Konto och innehåll</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Du ansvarar för att dina kontouppgifter är korrekta och att inloggningsuppgifter hålls säkra. Du står också för laglighet och riktighet
            i material du lämnar för bearbetning.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">4. Tjänstens natur</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Tjänsten tillhandahålls i demo- eller forskningsläge när inget abonnemang är aktivt. Priser och beräkningar är vägledande och ska inte
            förstås som bindande uppgifter från butikernas sida.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">5. Ansvar</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            GroceryView ansvarar inte för felaktiga uppgifter från tredjepartsdata. Prisjämförelser och rekommendationer är stöd för planering,
            inte garanti för exakt fakturerad kampanj eller tillgänglighet.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">6. Ändringar, tillgänglighet och tvist</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Villkor kan uppdateras när tjänsten utvecklas. För svenska konsumenter gäller svensk lag. Klagomål bör först riktas till support; om du
            är missnöjd kan du vända dig till Allmänna reklamationsnämnden.
          </p>
        </article>
      </section>
    </main>
  );
}
