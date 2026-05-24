export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Integritet</p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Personuppgiftspolicy</h1>
      <p className="max-w-3xl leading-7 text-zinc-600">
        Denna policy beskriver hur GroceryView behandlar personuppgifter för hushåll och användare i Sverige, i enlighet med GDPR,
        svensk tillämpning av dataskyddsregler och gällande konsumenträtt.
      </p>

      <section className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6">
        <article>
          <h2 className="text-lg font-semibold text-zinc-950">1. Personuppgiftsansvar</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            GroceryView är personuppgiftsansvarig för den personliga information som registreras i konton, budgetfunktioner, inställningar och
            den metadata som skapas vid inläsning av kvitton.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">2. Vilka uppgifter vi behandlar</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-sm leading-7 text-zinc-600">
            <li>E-post och kontoidentifierare.</li>
            <li>Inläggna hushållsval och sparade budgetinställningar.</li>
            <li>Strukturerad sammanställning från uppladdade kvitton.</li>
            <li>Platsuppgifter på områdesnivå för butiks- och jämförelsesammanhang.</li>
            <li>Tekniska loggar för säkerhet, drift och bedrägeriövervakning.</li>
          </ul>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">3. Ändamål och rättslig grund</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Uppgifterna används för prisjämförelser, budgetverktyg och drift av tjänsten. Behandlingen grundas på avtal och berättigat intresse
            enligt dataskyddsförordningen (EU 2016/679), samt samtycke där det krävs av särskilda regler för marknadsföring och analyser.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">4. Datalagring och gallring</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Råa bilagor (originalbilder) och känsliga tekniska attribut hålls skilt från analytiska resultat. Materialradering görs enligt interna
            tidsgränser och lagstadgade krav.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">5. Dina rättigheter</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Du har rätt till tillgång, rättelse, radering, begränsning, dataportabilitet, invändning och att återkalla samtycke. Förfrågningar
            behandlas skyndsamt inom de frister som gäller enligt svensk och EU-rätt.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">6. Kakor och loggning</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Endast nödvändiga cookies och lokal session används för autentisering och säker användning. Eventuella icke-essentiella verktyg och
            statistik redovisas separat i konto-/inställningsflödet.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">7. Överföring och säkerhet</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Datatrafik krypteras med TLS, åtkomst styrs med behörighetskontroller, och överföring utanför EES sker endast via godkända rättsliga
            mekanismer där så krävs.
          </p>
        </article>

        <article>
          <h2 className="text-lg font-semibold text-zinc-950">8. Kontakt</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            För frågor om integritet: använd kontaktvägen i appen eller skriv till vårt dataskyddsansvariga med den e-postadress som
            används i ditt konto.
          </p>
        </article>
      </section>
    </main>
  );
}
