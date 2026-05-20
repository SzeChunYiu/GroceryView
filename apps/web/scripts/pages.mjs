import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const flowScript = `<script>
window.GroceryViewFlowActions = (() => {
  const formatSek = (value) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(value);
  const setResult = (flow, message) => {
    const target = document.querySelector('[data-flow-result="' + flow + '"]');
    if (target) target.textContent = message;
  };
  const summarizeBasket = (form) => {
    const data = new FormData(form);
    const coffee = Number(data.get('coffeeQuantity') || 0);
    const milk = Number(data.get('milkQuantity') || 0);
    const eggs = Number(data.get('eggsQuantity') || 0);
    return coffee * 49.9 + milk * 13.9 + eggs * 34.9;
  };
  const messages = {
    'toggle-alert': 'Alert rule updated locally; production save waits for authenticated account API.',
    'manage-subscription': 'Billing portal handoff prepared without exposing provider customer IDs.',
    'download-export': 'Data export plan prepared with receipts, budgets, baskets, and anonymous contributions.',
    'plan-deletion': 'Deletion plan queued; destructive production action still requires re-authentication.',
    'route-review': 'Capture routed to manual review queue before it can update catalog prices.',
    'mark-matched': 'Matched capture previewed for basket and budget update.'
  };
  document.querySelectorAll('[data-groceryview-flow] form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const flow = form.closest('[data-groceryview-flow]')?.dataset.groceryviewFlow;
      const data = new FormData(form);
      if (flow === 'login') setResult(flow, 'Sign-in link queued for ' + (data.get('email') || 'your email') + '. Demo mode does not send email.');
      if (flow === 'household') setResult(flow, 'Household approval limit preview updated to ' + (data.get('approvalLimit') || '400') + ' SEK.');
      if (flow === 'basket') setResult(flow, 'Basket preview recalculated at ' + formatSek(summarizeBasket(form)) + ' before checkout.');
      if (flow === 'scanner') setResult(flow, 'Upload preview staged; OCR provider stays gated until credentials are configured.');
    });
  });
  document.querySelectorAll('[data-flow-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const flow = button.closest('[data-groceryview-flow]')?.dataset.groceryviewFlow;
      const action = button.dataset.flowAction;
      if (flow && action) setResult(flow, messages[action] || 'Action preview recorded.');
    });
  });
  return { setResult, summarizeBasket };
})();
</script>`;

const layout = ({ title, description, body }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="shell">
      <a class="pill" href="/">← GroceryView</a>
      ${body}
    </main>
    ${flowScript}
  </body>
</html>`;

const pages = [
  {
    path: 'login/index.html',
    title: 'Sign in to GroceryView — GroceryView',
    description: 'Secure GroceryView sign-in entry point for personalized watchlists, baskets, budgets, and household features.',
    body: `<section class="card" data-groceryview-flow="login"><div class="eyebrow">Account access</div><h1>Sign in to GroceryView</h1><p class="lede">Passkey or magic link authentication keeps personal grocery budgets and watchlists protected.</p><div class="grid"><div class="metric"><strong>Fail closed</strong><span>protected routes require a valid session</span></div><div class="metric"><strong>Bearer auth</strong><span>API contract already documents user-scoped routes</span></div><div class="metric"><strong>No password reuse</strong><span>passwordless sign-in target</span></div></div><form class="flow-panel" aria-label="Demo sign-in form"><label>Email for magic link<input name="email" type="email" placeholder="you@example.com" autocomplete="email" /></label><label>Workspace<select name="workspace"><option>Household workspace</option><option>Solo price watch</option><option>Reviewer desk</option></select></label><button type="submit">Send sign-in link</button></form><p class="flow-result" data-flow-result="login" aria-live="polite">Demo mode: no email sent until auth provider credentials are configured.</p></section>`
  },
  {
    path: 'account/index.html',
    title: 'Account settings — GroceryView',
    description: 'GroceryView account page scaffold for favorite stores, notification preferences, and personal price alerts.',
    body: `<section class="card" data-groceryview-flow="account"><div class="eyebrow">Settings</div><h1>Account settings</h1><p class="lede">Manage favorite stores, watchlist alerts, quiet hours, and grocery budget preferences from one account view.</p><div class="grid"><div class="metric"><strong>Stores</strong><span>favorite-store basket scope</span></div><div class="metric"><strong>Alerts</strong><span>target price and 52-week-low notifications</span></div><div class="metric"><strong>Budget</strong><span>weekly and monthly guardrails</span></div></div><div class="flow-panel" aria-label="Account actions"><button type="button" data-flow-action="toggle-alert">Toggle coffee alert</button><button type="button" data-flow-action="manage-subscription">Manage subscription</button></div><p class="flow-result" data-flow-result="account" aria-live="polite">Account actions preview locally until an authenticated session is present.</p></section><section class="card" style="margin-top:16px"><h2>Subscription access</h2><p class="lede">Premium access is active from <code>/api/account/subscription-access</code>; ads are removed and checkout prompts stay hidden while the entitlement remains current.</p><div class="grid"><div class="metric"><strong>Premium</strong><span>active entitlement</span></div><div class="metric"><strong>Ads removed</strong><span>non-critical ad slots hidden</span></div><div class="metric"><strong>Manage subscription</strong><span>billing portal action</span></div></div></section><section class="card" style="margin-top:16px"><h2>Alert preferences</h2><table class="table"><thead><tr><th>Rule</th><th>Channel</th><th>Quiet hours</th><th>Scope</th></tr></thead><tbody><tr><td>Coffee below 50 SEK</td><td>Push</td><td>21:00-07:00</td><td>Favorite stores</td></tr><tr><td>Butter deal score above 80</td><td>Email</td><td>Daily digest</td><td>All Stockholm stores</td></tr><tr><td>Receipt review reminder</td><td>Push</td><td>Immediate</td><td>Household queue</td></tr></tbody></table></section>`
  },
  {
    path: 'household/index.html',
    title: 'Household basket — GroceryView',
    description: 'Shared GroceryView household basket page scaffold with member attribution and shared budget signals.',
    body: `<section class="card" data-groceryview-flow="household"><div class="eyebrow">Household</div><h1>Shared household basket</h1><p class="lede">Coordinate a shared grocery basket with member attribution, merged quantities, and shared budget tracking.</p><div class="grid"><div class="metric"><strong>Member attribution</strong><span>who added each item</span></div><div class="metric"><strong>Shared budget</strong><span>household weekly plan</span></div><div class="metric"><strong>Roles</strong><span>owner and member controls</span></div></div><form class="flow-panel" aria-label="Household rule preview"><label>Approval limit SEK<input name="approvalLimit" type="number" min="0" step="50" value="400" /></label><label>Reviewer<select name="reviewer"><option>Mina</option><option>Alex</option><option>Sam</option></select></label><button type="submit">Preview household rule</button></form><p class="flow-result" data-flow-result="household" aria-live="polite">Current rule: owner approval over 400 SEK.</p></section><section class="card" style="margin-top:16px"><h2>Household rules</h2><table class="table"><thead><tr><th>Member</th><th>Budget</th><th>Approval rule</th><th>Diet</th></tr></thead><tbody><tr><td>Alex</td><td>50%</td><td>Owner approval over 400 SEK</td><td>Vegetarian, lactose ok</td></tr><tr><td>Mina</td><td>35%</td><td>Reviews low-confidence receipts</td><td>No pork, nut alert</td></tr><tr><td>Sam</td><td>15%</td><td>School lunch staples pinned</td><td>Child-friendly swaps</td></tr></tbody></table></section>`
  },
  {
    path: 'privacy/index.html',
    title: 'Privacy controls — GroceryView',
    description: 'GroceryView privacy controls for data export, account deletion, receipt redaction, and ad payload minimization.',
    body: `<section class="card" data-groceryview-flow="privacy"><div class="eyebrow">Privacy</div><h1>Export or delete your data</h1><p class="lede">Download personal data, plan account deletion, and verify advertiser payloads stay aggregated and receipt-safe.</p><div class="grid"><div class="metric"><strong>Export</strong><span>watchlists, budgets, and baskets</span></div><div class="metric"><strong>Delete</strong><span>sensitive rows removed by plan</span></div><div class="metric"><strong>Ads</strong><span>no raw receipt leakage</span></div></div><div class="flow-panel" aria-label="Privacy actions"><button type="button" data-flow-action="download-export">Download export</button><button type="button" data-flow-action="plan-deletion">Plan account deletion</button></div><p class="flow-result" data-flow-result="privacy" aria-live="polite">Privacy actions require re-authentication before live execution.</p></section><section class="card" style="margin-top:16px"><h2>Control states</h2><table class="table"><thead><tr><th>Setting</th><th>State</th><th>Detail</th></tr></thead><tbody><tr><td>Receipt images</td><td>Auto-delete after review</td><td>7 day retention window</td></tr><tr><td>Location precision</td><td>District only</td><td>Street address hidden from exports</td></tr><tr><td>Price contribution</td><td>Anonymous</td><td>No account identifier in catalog backfill</td></tr></tbody></table></section>`
  },
  {
    path: 'basket/index.html',
    title: 'Weekly basket — GroceryView',
    description: 'GroceryView basket page scaffold for favorite-store comparison, smart swaps, and budget review.',
    body: `<section class="card" data-groceryview-flow="basket"><div class="eyebrow">Basket</div><h1>Weekly basket planner</h1><p class="lede">Compare favorite-store totals, review smart swaps, and keep the weekly grocery plan under budget.</p><div class="grid"><div class="metric"><strong>742 SEK</strong><span>estimated basket total</span></div><div class="metric"><strong>58 SEK</strong><span>weekly budget left</span></div><div class="metric"><strong>3 swaps</strong><span>private-label opportunities</span></div></div><form class="flow-panel" aria-label="Basket quantity preview"><label>Coffee<input name="coffeeQuantity" type="number" min="0" value="1" /></label><label>Milk<input name="milkQuantity" type="number" min="0" value="2" /></label><label>Eggs<input name="eggsQuantity" type="number" min="0" value="1" /></label><button type="submit">Recalculate basket</button></form><p class="flow-result" data-flow-result="basket" aria-live="polite">Basket preview uses current favorite-store prices before saving.</p></section><section class="card" style="margin-top:16px"><h2>Basket lines</h2><table class="table"><thead><tr><th>Product</th><th>Best store</th><th>Line total</th></tr></thead><tbody><tr><td>coffee</td><td>Willys Odenplan</td><td>49.90 SEK</td></tr><tr><td>milk</td><td>Lidl Sveavägen</td><td>27.80 SEK</td></tr><tr><td>eggs</td><td>Lidl Sveavägen</td><td>34.90 SEK</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Smart swaps</h2><table class="table"><thead><tr><th>Swap</th><th>Saves</th><th>Rule</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g → Garant Bryggkaffe 450g</td><td>12 SEK</td><td>Same category, verified shelf price</td></tr><tr><td>Arla Milk 1L → ICA Milk 1L</td><td>2 SEK</td><td>Household accepts private label dairy</td></tr></tbody></table></section>`
  },
  {
    path: 'scanner/index.html',
    title: 'Barcode and receipt scanner — GroceryView',
    description: 'GroceryView scanner page scaffold for barcode lookup, receipt parsing, confidence, and manual review.',
    body: `<section class="card" data-groceryview-flow="scanner"><div class="eyebrow">Scanner</div><h1>Barcode and receipt scanner</h1><p class="lede">Scan products and receipts, surface confidence levels, and send uncertain matches to the manual review queue.</p><div class="grid"><div class="metric"><strong>Barcode</strong><span>product lookup and smart swaps</span></div><div class="metric"><strong>Receipt</strong><span>budget impact review</span></div><div class="metric"><strong>Confidence</strong><span>low-confidence review routing</span></div></div><form class="flow-panel" aria-label="Scanner upload preview"><label>Receipt or barcode image<input name="scanImage" type="file" accept="image/*" /></label><button type="submit">Preview upload</button></form><div class="flow-panel" aria-label="Scanner review actions"><button type="button" data-flow-action="route-review">Route to review</button><button type="button" data-flow-action="mark-matched">Mark matched</button></div><p class="flow-result" data-flow-result="scanner" aria-live="polite">Uploads remain local preview until OCR provider credentials are configured.</p></section><section class="card" style="margin-top:16px"><h2>Review queue</h2><table class="table"><thead><tr><th>Capture</th><th>Status</th><th>Next action</th></tr></thead><tbody><tr><td>Coop Farsta receipt</td><td>Needs human review</td><td>Confirm milk line item and loyalty discount</td></tr><tr><td>Arla Milk barcode</td><td>Matched</td><td>Ready for basket price update</td></tr><tr><td>Loose tomatoes label</td><td>Low confidence</td><td>Route to product matching queue</td></tr></tbody></table></section>`
  },
  {
    path: 'admin/human-review/index.html',
    title: 'Human review operations — GroceryView',
    description: 'GroceryView admin page scaffold for human-review assignments, SLA status, reviewer authorization, and decision writebacks.',
    body: `<section class="card"><div class="eyebrow">Operations</div><h1>Human review operations</h1><p class="lede">Review low-confidence product matches and community reports before they can update catalog data.</p><div class="grid"><div class="metric"><strong>breached</strong><span>SLA status</span></div><div class="metric"><strong>2</strong><span>open assignments</span></div><div class="metric"><strong>moderator-owned</strong><span>decision access</span></div></div></section><section class="card" style="margin-top:16px"><h2>Moderator assignments</h2><table class="table"><thead><tr><th>Review</th><th>Priority</th><th>Assignee</th><th>Due</th><th>Action</th></tr></thead><tbody><tr><td>review-match-1</td><td>high</td><td>moderator-1</td><td>SLA breached</td><td>Approve product match</td></tr><tr><td>review-report-1</td><td>medium</td><td>moderator-2</td><td>Due tomorrow</td><td>Keep in review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Decision writeback</h2><p class="lede">Approval writes <strong>approve_product_match</strong>; rejection writes <strong>reject_product_match</strong>; needs-more-info keeps the assignment in progress for a registered reviewer.</p></section>`
  },
  {
    path: 'market/index.html',
    title: 'Stockholm Grocery Market — GroceryView',
    description: 'Stockholm grocery market overview with indices, top movers, and true deals.',
    body: `<section class="card"><div class="eyebrow">Market</div><h1>Stockholm Grocery Market</h1><p class="lede">Top movers, best true deals, and grocery indices for Stockholm.</p><div class="grid"><div class="metric"><strong>101.6</strong><span>Stockholm Grocery Index</span></div><div class="metric"><strong>91.6</strong><span>Coffee Index</span></div><div class="metric"><strong>108.4</strong><span>Dairy Index</span></div></div></section>`
  },
  {
    path: 'products/coffee/index.html',
    title: 'ZOEGAS-COFFEE-450G price history — GroceryView',
    description: 'Zoégas Coffee 450g price ticker with current prices, price history, and Deal Score.',
    body: `<section class="card"><div class="eyebrow">Product ticker</div><h1>ZOEGAS-COFFEE-450G</h1><p class="lede">Current best price: 49.90 SEK at Willys Odenplan.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score</span></div><div class="metric"><strong>8th</strong><span>Stockholm percentile</span></div><div class="metric"><strong>6th</strong><span>Historical percentile</span></div></div></section>`
  },
  {
    path: 'stores/willys-odenplan/index.html',
    title: 'Willys Odenplan store deals — GroceryView',
    description: 'Willys Odenplan profile with deal score, price level, and best categories.',
    body: `<section class="card"><div class="eyebrow">Store</div><h1>Willys Odenplan</h1><p class="lede">Favorite-store profile for Odenplan grocery deals.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score Today</span></div><div class="metric"><strong>-12%</strong><span>vs Stockholm average</span></div><div class="metric"><strong>Coffee</strong><span>Best category</span></div></div></section><section class="card" style="margin-top:16px"><h2>Store highlights</h2><table class="table"><thead><tr><th>Category</th><th>Signal</th><th>Confidence</th></tr></thead><tbody><tr><td>Coffee</td><td>-12% vs Stockholm average</td><td>Verified shelf</td></tr><tr><td>Milk</td><td>Competitive family basket line</td><td>Retailer page</td></tr><tr><td>Butter</td><td>Watchlist only, above usual price</td><td>Estimated</td></tr></tbody></table></section>`
  },
  {
    path: 'stores/compare/index.html',
    title: 'Compare Stockholm grocery stores — GroceryView',
    description: 'Compare Stockholm grocery stores by basket total, verified price coverage, confidence risk, best category, and weekly shopper fit.',
    body: `<section class="card"><div class="eyebrow">Store comparison</div><h1>Compare Stockholm stores</h1><p class="lede">Rank favorite stores by verified basket total, coverage, low-confidence risk, and category strengths before choosing a weekly shop.</p><div class="grid"><div class="metric"><strong>Willys</strong><span>best coffee coverage</span></div><div class="metric"><strong>Lidl</strong><span>lowest basket total</span></div><div class="metric"><strong>Coop</strong><span>review before checkout</span></div></div></section><section class="card" style="margin-top:16px"><h2>Favorite-store comparison</h2><table class="table"><thead><tr><th>Store</th><th>Basket total</th><th>Verified coverage</th><th>Low-confidence rows</th><th>Best category</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>742 SEK</td><td>82%</td><td>2</td><td>Coffee</td></tr><tr><td>Lidl Sveavägen</td><td>729 SEK</td><td>76%</td><td>3</td><td>Eggs and dairy</td></tr><tr><td>Coop Farsta</td><td>781 SEK</td><td>68%</td><td>5</td><td>Member promos</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Decision notes</h2><table class="table"><thead><tr><th>Store</th><th>Recommended use</th><th>Trust guardrail</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>Primary weekly basket when coffee is in stock</td><td>Verified shelf and retailer-page rows agree</td></tr><tr><td>Lidl Sveavägen</td><td>Cheapest split basket for dairy and eggs</td><td>Confirm flyer-only promotions before routing</td></tr><tr><td>Coop Farsta</td><td>Use for member promos after review</td><td>Low-confidence receipt rows stay out of Deal Score</td></tr></tbody></table></section>`
  },
  {
    path: 'categories/coffee/index.html',
    title: 'Coffee deals in Stockholm — GroceryView',
    description: 'Coffee category page with price index, top deals, and percentile signals.',
    body: `<section class="card"><div class="eyebrow">Category</div><h1>Stockholm Coffee Deals</h1><p class="lede">Coffee Index is at 91.6 with strong current promotions.</p><div class="grid"><div class="metric"><strong>-8.4%</strong><span>1M move</span></div><div class="metric"><strong>12th</strong><span>Historical percentile</span></div><div class="metric"><strong>Zoégas</strong><span>Top deal</span></div></div></section><section class="card" style="margin-top:16px"><h2>Category signals</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Price</th><th>Signal</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Willys Odenplan</td><td>49.90 SEK</td><td>12th historical percentile</td></tr><tr><td>Garant Bryggkaffe 450g</td><td>Willys Odenplan</td><td>37.90 SEK</td><td>Private-label swap candidate</td></tr><tr><td>Arvid Nordquist 500g</td><td>Coop Farsta</td><td>59.90 SEK</td><td>Watchlist only</td></tr></tbody></table></section>`
  }
];

export async function buildStaticPages(root) {
  const written = [];
  for (const page of pages) {
    const destination = join(root, page.path);
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, layout(page));
    written.push(page.path);
  }
  return written;
}
