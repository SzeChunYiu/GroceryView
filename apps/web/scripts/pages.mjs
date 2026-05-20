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
    path: 'watchlist/index.html',
    title: 'Price watchlist workbench — GroceryView',
    description: 'GroceryView watchlist workbench for target prices, Deal Score triggers, notification channels, and confidence-safe alert status.',
    body: `<section class="card"><div class="eyebrow">Watchlist</div><h1>Price watchlist workbench</h1><p class="lede">Review target prices, Deal Score triggers, source confidence, and notification readiness before alerts reach a household.</p><div class="grid"><div class="metric"><strong>4</strong><span>tracked staples</span></div><div class="metric"><strong>2</strong><span>alerts ready</span></div><div class="metric"><strong>1</strong><span>held for review</span></div></div></section><section class="card" style="margin-top:16px"><h2>Tracked items</h2><table class="table"><thead><tr><th>Product</th><th>Target</th><th>Current</th><th>Trigger</th><th>Status</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>50 SEK</td><td>49.90 SEK</td><td>Deal Score ≥ 80</td><td>Ready for push</td></tr><tr><td>Butter 600g</td><td>45 SEK</td><td>54.90 SEK</td><td>52-week low</td><td>Watching</td></tr><tr><td>Eggs 12-pack</td><td>35 SEK</td><td>34.90 SEK</td><td>Favorite stores only</td><td>Ready for email</td></tr><tr><td>Loose tomatoes</td><td>29 SEK/kg</td><td>Estimated</td><td>Confidence ≥ 80%</td><td>Held for review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Notification guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied behavior</th></tr></thead><tbody><tr><td>Quiet hours</td><td>Push alerts pause from 21:00 to 07:00.</td></tr><tr><td>Confidence floor</td><td>Estimated prices cannot trigger household notifications.</td></tr><tr><td>Favorite-store scope</td><td>Scoped rules ignore stores outside the household basket set.</td></tr></tbody></table></section>`
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
    path: 'budget/forecast/index.html',
    title: 'Grocery budget forecast — GroceryView',
    description: 'Forecast GroceryView household grocery spend with weekly basket totals, month-end projection, receipt actuals, and over-budget prevention actions.',
    body: `<section class="card"><div class="eyebrow">Budget forecast</div><h1>Grocery budget forecast</h1><p class="lede">Compare planned baskets with receipt actuals, project month-end spend, and choose corrective actions before the household goes over budget.</p><div class="grid"><div class="metric"><strong>742 SEK</strong><span>next basket forecast</span></div><div class="metric"><strong>501 SEK</strong><span>spent this week</span></div><div class="metric"><strong>3 084 SEK</strong><span>month-end projection</span></div></div></section><section class="card" style="margin-top:16px"><h2>Forecast ledger</h2><table class="table"><thead><tr><th>Period</th><th>Budget</th><th>Actual / forecast</th><th>Variance</th><th>Status</th></tr></thead><tbody><tr><td>This week actuals</td><td>800 SEK</td><td>501 SEK</td><td>+299 SEK</td><td>On track</td></tr><tr><td>Next planned basket</td><td>800 SEK</td><td>742 SEK</td><td>+58 SEK</td><td>Needs review</td></tr><tr><td>Month-end projection</td><td>3 200 SEK</td><td>3 084 SEK</td><td>+116 SEK</td><td>On track</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Correction plan</h2><table class="table"><thead><tr><th>Action</th><th>Impact</th><th>Guardrail</th></tr></thead><tbody><tr><td>Apply coffee private-label swap</td><td>Saves 12 SEK</td><td>Requires verified shelf price</td></tr><tr><td>Move eggs to Lidl split basket</td><td>Saves 4 SEK</td><td>Favorite-store only route</td></tr><tr><td>Hold estimated tomato price</td><td>Avoids false saving</td><td>Needs review before forecast credit</td></tr></tbody></table></section>`
  },
  {
    path: 'scanner/index.html',
    title: 'Barcode and receipt scanner — GroceryView',
    description: 'GroceryView scanner page scaffold for barcode lookup, receipt parsing, confidence, and manual review.',
    body: `<section class="card" data-groceryview-flow="scanner"><div class="eyebrow">Scanner</div><h1>Barcode and receipt scanner</h1><p class="lede">Scan products and receipts, surface confidence levels, and send uncertain matches to the manual review queue.</p><div class="grid"><div class="metric"><strong>Barcode</strong><span>product lookup and smart swaps</span></div><div class="metric"><strong>Receipt</strong><span>budget impact review</span></div><div class="metric"><strong>Confidence</strong><span>low-confidence review routing</span></div></div><form class="flow-panel" aria-label="Scanner upload preview"><label>Receipt or barcode image<input name="scanImage" type="file" accept="image/*" /></label><button type="submit">Preview upload</button></form><div class="flow-panel" aria-label="Scanner review actions"><button type="button" data-flow-action="route-review">Route to review</button><button type="button" data-flow-action="mark-matched">Mark matched</button></div><p class="flow-result" data-flow-result="scanner" aria-live="polite">Uploads remain local preview until OCR provider credentials are configured.</p></section><section class="card" style="margin-top:16px"><h2>Review queue</h2><table class="table"><thead><tr><th>Capture</th><th>Status</th><th>Next action</th></tr></thead><tbody><tr><td>Coop Farsta receipt</td><td>Needs human review</td><td>Confirm milk line item and loyalty discount</td></tr><tr><td>Arla Milk barcode</td><td>Matched</td><td>Ready for basket price update</td></tr><tr><td>Loose tomatoes label</td><td>Low confidence</td><td>Route to product matching queue</td></tr></tbody></table></section>`
  },
  {
    path: 'receipts/review/index.html',
    title: 'Receipt review desk — GroceryView',
    description: 'Review GroceryView receipt line items by confidence, product match, loyalty discount, budget writeback, and catalog update eligibility.',
    body: `<section class="card"><div class="eyebrow">Receipt review</div><h1>Receipt review desk</h1><p class="lede">Confirm line-item matches, loyalty discounts, and budget writebacks before receipt data updates household spend or catalog prices.</p><div class="grid"><div class="metric"><strong>3</strong><span>receipt lines</span></div><div class="metric"><strong>1</strong><span>needs moderator</span></div><div class="metric"><strong>501 SEK</strong><span>weekly actuals impact</span></div></div></section><section class="card" style="margin-top:16px"><h2>Line-item decisions</h2><table class="table"><thead><tr><th>Line</th><th>Match</th><th>Confidence</th><th>Budget action</th><th>Catalog action</th></tr></thead><tbody><tr><td>Arla Milk 1L</td><td>ARLA-MILK-1L</td><td>98%</td><td>Post to weekly actuals</td><td>Update verified price</td></tr><tr><td>Coop loyalty discount</td><td>receipt discount</td><td>84%</td><td>Apply receipt total only</td><td>No product price update</td></tr><tr><td>Loose tomatoes</td><td>unknown produce</td><td>54%</td><td>Hold from forecast</td><td>Route to human review</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Writeback guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Decision</th></tr></thead><tbody><tr><td>Low confidence below 80%</td><td>Cannot update catalog or Deal Score.</td></tr><tr><td>Loyalty discount line</td><td>Impacts receipt total without changing shelf price.</td></tr><tr><td>Verified product match</td><td>Can update household spend and product price history.</td></tr></tbody></table></section>`
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
    path: 'deals/today/index.html',
    title: 'Today’s best grocery deals — GroceryView',
    description: 'Daily GroceryView deal board with Deal Score, source confidence, savings, and recommended shopper actions.',
    body: `<section class="card"><div class="eyebrow">Daily deal board</div><h1>Today’s best grocery deals</h1><p class="lede">Prioritize verified discounts with strong Deal Scores, clear source confidence, and practical shopping actions.</p><div class="grid"><div class="metric"><strong>82</strong><span>top Deal Score</span></div><div class="metric"><strong>3</strong><span>verified deal rows</span></div><div class="metric"><strong>44 SEK</strong><span>basket savings</span></div></div></section><section class="card" style="margin-top:16px"><h2>Ranked deal actions</h2><table class="table"><thead><tr><th>Product</th><th>Store</th><th>Deal Score</th><th>Confidence</th><th>Action</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Willys Odenplan</td><td>82</td><td>Verified shelf</td><td>Buy two for this week</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Sveavägen</td><td>76</td><td>Retailer page</td><td>Add to split basket</td></tr><tr><td>Garant Bryggkaffe 450g</td><td>Willys Odenplan</td><td>73</td><td>Verified shelf</td><td>Use as private-label swap</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Deal guardrails</h2><table class="table"><thead><tr><th>Rule</th><th>Why it matters</th></tr></thead><tbody><tr><td>Ads excluded from ranking</td><td>Sponsored placements cannot increase Deal Score.</td></tr><tr><td>Estimated rows held back</td><td>Low-confidence prices must be reviewed before appearing as top deals.</td></tr><tr><td>Member prices labeled</td><td>Loyalty-only offers are separated from public shelf prices.</td></tr></tbody></table></section>`
  },
  {
    path: 'savings/smart-swaps/index.html',
    title: 'Smart grocery swaps — GroceryView',
    description: 'Compare GroceryView smart swaps by savings, equivalence rule, household fit, source confidence, and budget impact.',
    body: `<section class="card"><div class="eyebrow">Smart swaps</div><h1>Smart grocery swaps</h1><p class="lede">Review substitute recommendations that save money while respecting product equivalence, household constraints, and verified-price requirements.</p><div class="grid"><div class="metric"><strong>3</strong><span>swap candidates</span></div><div class="metric"><strong>18 SEK</strong><span>weekly savings</span></div><div class="metric"><strong>0</strong><span>diet conflicts</span></div></div></section><section class="card" style="margin-top:16px"><h2>Swap candidates</h2><table class="table"><thead><tr><th>Current item</th><th>Suggested swap</th><th>Saves</th><th>Equivalence</th><th>Decision</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g</td><td>Garant Bryggkaffe 450g</td><td>12 SEK</td><td>Same roast category and pack size</td><td>Recommend</td></tr><tr><td>Arla Milk 1L</td><td>ICA Milk 1L</td><td>2 SEK</td><td>Same fat level and chilled dairy</td><td>Recommend</td></tr><tr><td>Eggs 12-pack</td><td>Lidl Eggs 12-pack</td><td>4 SEK</td><td>Same pack size</td><td>Recommend in split basket</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Swap guardrails</h2><table class="table"><thead><tr><th>Guardrail</th><th>Applied rule</th></tr></thead><tbody><tr><td>Verified price required</td><td>Estimated swap prices cannot reduce forecast spend.</td></tr><tr><td>Household diet first</td><td>Dietary restrictions outrank savings.</td></tr><tr><td>No travel penalty</td><td>Distance is shown separately and does not hide cheapest valid swaps.</td></tr></tbody></table></section>`
  },
  {
    path: 'products/coffee/index.html',
    title: 'ZOEGAS-COFFEE-450G price history — GroceryView',
    description: 'Zoégas Coffee 450g price ticker with current prices, price history, and Deal Score.',
    body: `<section class="card"><div class="eyebrow">Product ticker</div><h1>ZOEGAS-COFFEE-450G</h1><p class="lede">Current best price: 49.90 SEK at Willys Odenplan.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score</span></div><div class="metric"><strong>8th</strong><span>Stockholm percentile</span></div><div class="metric"><strong>6th</strong><span>Historical percentile</span></div></div></section><section class="card" style="margin-top:16px"><h2>Price chart</h2><div class="toolbar" aria-label="Chart range"><span class="pill">7D</span><span class="pill">30D</span><span class="pill">90D</span><span class="pill">1Y</span></div><svg class="price-chart" viewBox="0 0 720 260" role="img" aria-label="Multi-store coffee price history with promo markers and confidence styling"><line x1="44" y1="42" x2="44" y2="218" stroke="#37524b"/><line x1="44" y1="218" x2="690" y2="218" stroke="#37524b"/><polyline points="56,92 150,96 244,110 338,126 432,130 526,146 620,142" fill="none" stroke="#20d9a6" stroke-width="4"/><polyline points="56,112 150,116 244,121 338,128 432,137 526,151 620,157" fill="none" stroke="#7cf2ce" stroke-width="4"/><polyline points="56,80 150,88 244,102 338,118 432,132 526,138 620,150" fill="none" stroke="#ffca66" stroke-width="4" stroke-dasharray="8 8"/><circle cx="526" cy="146" r="8" fill="#20d9a6"/><circle cx="620" cy="150" r="8" fill="#ffca66"/><text x="536" y="132" fill="#ccfff0" font-size="13">promo marker</text><text x="54" y="236" fill="#88a49c" font-size="12">May 14</text><text x="300" y="236" fill="#88a49c" font-size="12">May 17</text><text x="584" y="236" fill="#88a49c" font-size="12">May 20</text></svg><table class="table"><thead><tr><th>Store line</th><th>Style</th><th>Confidence</th></tr></thead><tbody><tr><td>Willys Odenplan</td><td>Solid green</td><td>Verified shelf and promo observations</td></tr><tr><td>ICA Kvantum Torsplan</td><td>Solid mint</td><td>Retailer page observations</td></tr><tr><td>Coop Medborgarplatsen</td><td>Dotted amber</td><td>Estimated observations need review</td></tr></tbody></table></section>`
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
