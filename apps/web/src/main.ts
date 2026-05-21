const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main class="app-shell">
      <section class="card">
        <div class="eyebrow">Verified-data fallback</div>
        <h1>GroceryView uses the Next.js interface now.</h1>
        <p class="lede">This legacy static entry contains no sample baskets, fake accounts, or invented prices. Open the Next.js app to view Axfood, OpenPrices, and OpenStreetMap-backed data.</p>
        <p><a class="button" href="/">Open GroceryView</a></p>
      </section>
    </main>
  `;
}
