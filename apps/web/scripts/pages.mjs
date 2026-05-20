import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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
  </body>
</html>`;

const pages = [
  {
    path: 'login/index.html',
    title: 'Sign in to GroceryView — GroceryView',
    description: 'Secure GroceryView sign-in entry point for personalized watchlists, baskets, budgets, and household features.',
    body: `<section class="card"><div class="eyebrow">Account access</div><h1>Sign in to GroceryView</h1><p class="lede">Passkey or magic link authentication keeps personal grocery budgets and watchlists protected.</p><div class="grid"><div class="metric"><strong>Fail closed</strong><span>protected routes require a valid session</span></div><div class="metric"><strong>Bearer auth</strong><span>API contract already documents user-scoped routes</span></div><div class="metric"><strong>No password reuse</strong><span>passwordless sign-in target</span></div></div></section>`
  },
  {
    path: 'account/index.html',
    title: 'Account settings — GroceryView',
    description: 'GroceryView account page scaffold for favorite stores, notification preferences, and personal price alerts.',
    body: `<section class="card"><div class="eyebrow">Settings</div><h1>Account settings</h1><p class="lede">Manage favorite stores, watchlist alerts, quiet hours, and grocery budget preferences from one account view.</p><div class="grid"><div class="metric"><strong>Stores</strong><span>favorite-store basket scope</span></div><div class="metric"><strong>Alerts</strong><span>target price and 52-week-low notifications</span></div><div class="metric"><strong>Budget</strong><span>weekly and monthly guardrails</span></div></div></section><section class="card" style="margin-top:16px"><h2>Alert preferences</h2><table class="table"><thead><tr><th>Rule</th><th>Channel</th><th>Quiet hours</th><th>Scope</th></tr></thead><tbody><tr><td>Coffee below 50 SEK</td><td>Push</td><td>21:00-07:00</td><td>Favorite stores</td></tr><tr><td>Butter deal score above 80</td><td>Email</td><td>Daily digest</td><td>All Stockholm stores</td></tr><tr><td>Receipt review reminder</td><td>Push</td><td>Immediate</td><td>Household queue</td></tr></tbody></table></section>`
  },
  {
    path: 'household/index.html',
    title: 'Household basket — GroceryView',
    description: 'Shared GroceryView household basket page scaffold with member attribution and shared budget signals.',
    body: `<section class="card"><div class="eyebrow">Household</div><h1>Shared household basket</h1><p class="lede">Coordinate a shared grocery basket with member attribution, merged quantities, and shared budget tracking.</p><div class="grid"><div class="metric"><strong>Member attribution</strong><span>who added each item</span></div><div class="metric"><strong>Shared budget</strong><span>household weekly plan</span></div><div class="metric"><strong>Roles</strong><span>owner and member controls</span></div></div></section><section class="card" style="margin-top:16px"><h2>Household rules</h2><table class="table"><thead><tr><th>Member</th><th>Budget</th><th>Approval rule</th><th>Diet</th></tr></thead><tbody><tr><td>Alex</td><td>50%</td><td>Owner approval over 400 SEK</td><td>Vegetarian, lactose ok</td></tr><tr><td>Mina</td><td>35%</td><td>Reviews low-confidence receipts</td><td>No pork, nut alert</td></tr><tr><td>Sam</td><td>15%</td><td>School lunch staples pinned</td><td>Child-friendly swaps</td></tr></tbody></table></section>`
  },
  {
    path: 'privacy/index.html',
    title: 'Privacy controls — GroceryView',
    description: 'GroceryView privacy controls for data export, account deletion, receipt redaction, and ad payload minimization.',
    body: `<section class="card"><div class="eyebrow">Privacy</div><h1>Export or delete your data</h1><p class="lede">Download personal data, plan account deletion, and verify advertiser payloads stay aggregated and receipt-safe.</p><div class="grid"><div class="metric"><strong>Export</strong><span>watchlists, budgets, and baskets</span></div><div class="metric"><strong>Delete</strong><span>sensitive rows removed by plan</span></div><div class="metric"><strong>Ads</strong><span>no raw receipt leakage</span></div></div></section><section class="card" style="margin-top:16px"><h2>Control states</h2><table class="table"><thead><tr><th>Setting</th><th>State</th><th>Detail</th></tr></thead><tbody><tr><td>Receipt images</td><td>Auto-delete after review</td><td>7 day retention window</td></tr><tr><td>Location precision</td><td>District only</td><td>Street address hidden from exports</td></tr><tr><td>Price contribution</td><td>Anonymous</td><td>No account identifier in catalog backfill</td></tr></tbody></table></section>`
  },
  {
    path: 'basket/index.html',
    title: 'Weekly basket — GroceryView',
    description: 'GroceryView basket page scaffold for favorite-store comparison, smart swaps, and budget review.',
    body: `<section class="card"><div class="eyebrow">Basket</div><h1>Weekly basket planner</h1><p class="lede">Compare favorite-store totals, review smart swaps, and keep the weekly grocery plan under budget.</p><div class="grid"><div class="metric"><strong>742 SEK</strong><span>estimated basket total</span></div><div class="metric"><strong>58 SEK</strong><span>weekly budget left</span></div><div class="metric"><strong>3 swaps</strong><span>private-label opportunities</span></div></div></section><section class="card" style="margin-top:16px"><h2>Basket lines</h2><table class="table"><thead><tr><th>Product</th><th>Best store</th><th>Line total</th></tr></thead><tbody><tr><td>coffee</td><td>Willys Odenplan</td><td>49.90 SEK</td></tr><tr><td>milk</td><td>Lidl Sveavägen</td><td>27.80 SEK</td></tr><tr><td>eggs</td><td>Lidl Sveavägen</td><td>34.90 SEK</td></tr></tbody></table></section><section class="card" style="margin-top:16px"><h2>Smart swaps</h2><table class="table"><thead><tr><th>Swap</th><th>Saves</th><th>Rule</th></tr></thead><tbody><tr><td>Zoégas Coffee 450g → Garant Bryggkaffe 450g</td><td>12 SEK</td><td>Same category, verified shelf price</td></tr><tr><td>Arla Milk 1L → ICA Milk 1L</td><td>2 SEK</td><td>Household accepts private label dairy</td></tr></tbody></table></section>`
  },
  {
    path: 'scanner/index.html',
    title: 'Barcode and receipt scanner — GroceryView',
    description: 'GroceryView scanner page scaffold for barcode lookup, receipt parsing, confidence, and manual review.',
    body: `<section class="card"><div class="eyebrow">Scanner</div><h1>Barcode and receipt scanner</h1><p class="lede">Scan products and receipts, surface confidence levels, and send uncertain matches to the manual review queue.</p><div class="grid"><div class="metric"><strong>Barcode</strong><span>product lookup and smart swaps</span></div><div class="metric"><strong>Receipt</strong><span>budget impact review</span></div><div class="metric"><strong>Confidence</strong><span>low-confidence review routing</span></div></div></section><section class="card" style="margin-top:16px"><h2>Review queue</h2><table class="table"><thead><tr><th>Capture</th><th>Status</th><th>Next action</th></tr></thead><tbody><tr><td>Coop Farsta receipt</td><td>Needs human review</td><td>Confirm milk line item and loyalty discount</td></tr><tr><td>Arla Milk barcode</td><td>Matched</td><td>Ready for basket price update</td></tr><tr><td>Loose tomatoes label</td><td>Low confidence</td><td>Route to product matching queue</td></tr></tbody></table></section>`
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
    path: 'categories/coffee/index.html',
    title: 'Coffee deals in Stockholm — GroceryView',
    description: 'Coffee category page with price index, top deals, and percentile signals.',
    body: `<section class="card"><div class="eyebrow">Category</div><h1>Stockholm Coffee Deals</h1><p class="lede">Coffee Index is at 91.6 with strong current promotions.</p><div class="grid"><div class="metric"><strong>-8.4%</strong><span>1M move</span></div><div class="metric"><strong>12th</strong><span>Historical percentile</span></div><div class="metric"><strong>Zoégas</strong><span>Top deal</span></div></div></section>`
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
