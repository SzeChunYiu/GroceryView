# GOAL — GroceryView

Updated: 2026-05-21 10:30 by billy (operator)

## Sprint target (≤7 days)

Ship a **visibly populated Stockholm grocery price terminal** at
`https://grocery-web-mu.vercel.app/`. The live homepage must surface, at a
minimum, **every store and product fixture already produced by the swarm** —
not the Next.js scaffold seed. Each iteration must measurably grow what an
unauthenticated visitor sees on `/`.

The previous infrastructure goals (catalog coverage, ingestion connectors, API
surface, DB schema) still hold as regression bars but **stop counting as
sprint progress** unless they also reach the user-visible artifact this
iteration. See [Visible Artifact](#visible-artifact) below for the gate.

## Acceptance test (executable)

```bash
# 1. driver file is not the scaffold stub — must declare ≥6 stores and ≥10 products
NPROD=$(grep -c "^\s*slug: '" apps/web/src/lib/demo-data.ts)
NSTORE=$(grep -c "name: '[A-Z]" apps/web/src/lib/demo-data.ts)
[ "$NPROD" -ge 10 ] && [ "$NSTORE" -ge 6 ]

# 2. prod URL serves the same store/product slugs from the driver file
LIVE=$(curl -sL https://grocery-web-mu.vercel.app/)
for s in willys-odenplan ica-nara-sergels-torg coop-swedenborgsgatan lidl-sveavagen; do
  echo "$LIVE" | grep -q "$s" || { echo "missing: $s on prod"; exit 1; }
done

# 3. every store in packages/ingestion fixtures is mirrored in the driver file
INGESTION_STORES=$(grep -oE "storeName: '[^']+'" packages/ingestion/src/index.ts | sort -u)
for s in $INGESTION_STORES; do grep -qF "$s" apps/web/src/lib/demo-data.ts; done
```

## Visible Artifact

The live site at `https://grocery-web-mu.vercel.app/` renders from:

- **Driver files (commits MUST grow these or `wire:` to these):**
  - `apps/web/src/lib/demo-data.ts` — stores, products, categories shown on `/`
  - `apps/web/src/components/sample-data.ts` — basket / household / privacy demo
  - `apps/web/src/components/market-shell.tsx` — the JSX that renders the
    driver-file data
- **Driver routes:** `apps/web/src/app/**/page.tsx` (in particular `page.tsx`,
  `products/[slug]/page.tsx`, `stores/[slug]/page.tsx`)
- **Prod URL:** `https://grocery-web-mu.vercel.app/`
- **Live count gate (acceptance test #2 above):** at least 6 distinct store
  slugs and 10 distinct product slugs visible in the rendered HTML.

**Worker rule:** an iteration that adds fixtures to `packages/ingestion`,
`packages/catalog`, `apps/api` etc. WITHOUT also adding a row to a driver
file is REJECTED by the MANAGER as infrastructure-only. The same iteration
must either (a) bump a driver file, OR (b) be an explicit `wire:` PR titled
`wire: surface <X> to homepage` linking the new fixture to a driver file.

## Product source paths (commits must touch ≥1 of these)

- `apps/web/`
- `apps/api/`
- `apps/mobile/`
- `packages/catalog/`
- `packages/ingestion/`
- `packages/server/`
- `packages/api/`
- `packages/db/`
- `packages/scanning/`
- `packages/ops/`
- `packages/monetization/`
- `packages/notifications/`
- `packages/auth/`
- `packages/core/`

## Non-product paths (commits touching ONLY these are REVERTED by managers)

- `docs/`, `codex-tasks/`, `change_log/`, `reports/`, `deploy/`

## Banned iteration types

- queue-refresh, planner-audit-without-source-diff, validator-policy-refresh,
  manager-review-without-rejection-or-accept, docs-only-handoff,
  status-summary-as-deliverable
- **NEW:** infrastructure-only iterations that do not reach a driver file (see
  Visible Artifact above)

## Feature backlog — surface the analytics engine (operator priority, 2026-05-21)

`@groceryview/core` already exports ~41 TESTED analytics functions; the web app
imports only ~4. The single biggest visible-value lever now is **wiring real
core analytics into the already-scaffolded routes** (`/compare`, `/meal-planner`,
`/savings-dashboard`, `/watchlist`, `/pantry-planner`, `categories/[slug]`,
`products/[slug]`). Each item below is one feature = one PR.

**Hard rules for every backlog item:**
- Import and call the REAL core function — never reimplement, stub, or hardcode
  its output.
- **No fabricated numbers.** If an input is missing (e.g. price history for a
  percentile), derive it from data we actually have (cross-chain spread, unit
  prices) and show a coverage/confidence indicator — never invent values. This
  is the same discipline as `calculateChainPriceIndex` (already shipped).
- Reach a driver file / visible route (Visible-Artifact gate still applies).
- Build + typecheck must pass; add/extend a core test if you touch core.

### P1 — highest visible value
1. **Deal score + verdict on `products/[slug]`** — `calculateDealScore` + `scoreBand`
   ("Excellent deal / Buy now" … "Not a real deal / Wait"). Where full history is
   missing, feed percentiles derived from the cross-chain price spread and mark
   confidence. This is the "real-deal detector".
2. **Cheapest-chain-per-product** — use the cross-chain matched products (the
   #531 Willys↔Hemköp matches) to show, on `products/[slug]` and `/compare`,
   each chain's price for the item and highlight the cheapest. The user's
   "price across chains / who's cheapest" ask.
3. **Category deal leaders** — `summarizeCategoryDealLeaders` on `categories/[slug]`
   and a "Today's best deals" strip on `/`.
4. **Personal grocery inflation** — `calculatePersonalGroceryInflation` on
   `/savings-dashboard` (a personal CPI for the visitor's basket).
5. **Smart swaps** — `recommendSmartSwaps` on `products/[slug]` (cheaper
   equivalent substitutes).

### P2
6. **Nutrition per krona** — `rankNutritionPerKrona` (best calories/protein per SEK).
7. **Expiry deal radar** — `buildExpiryDealRadar` on a `/deals` page.
8. **Watchlist price alerts** — `buildWatchlistAlerts` + `planNotifications` on `/watchlist`.
9. **Basket optimizer** — `compareBasketStrategies` + `summarizeStoreBasketCoverage`
   on `/weekly-basket` (which store is cheapest for *your* basket).
10. **Deal-based meals** — `suggestDealBasedMeals` on `/meal-planner`.
11. **Pantry replenishment** — `planPantryReplenishment` on `/pantry-planner`.
12. **Brand-tier index** — `calculateBrandTierIndices` (budget vs premium) as a
    section on `/chain-index`.

### P3 — map + index tie-ins
13. Color `/map` store markers by their chain's `/chain-index` score; add a
    "cheapest chain near me" highlight.
14. Price-by-district heat overlay on `/map`.
15. Matched-basket refinement for `calculateChainPriceIndex` using the cross-chain
    matched products (raises confidence; keep the 100-centred scale).

Already shipped this sprint (regression bars): `/map` (#575), `/chain-index` (#583).

## Product north-star — "a financial terminal for groceries"

GroceryView turns grocery prices into a market: every product is a **ticker**
with a price chart, chains/categories/brands have **indices**, deals get a
**Buy/Wait rating**, and shoppers **track, compare, and get alerted** — across
chains and branches, over time. Reach full parity with Matspar (basket
comparison) + Matpriskollen (offer/price tracking), THEN exceed them with
best-in-class UX distilled from outside the grocery space. Workers: treat this
section as the long-horizon backlog once the P1–P3 analytics items are shipped;
one feature = one PR; every number must trace to real data + a confidence
indicator, never fabricated.

### Cross-domain distillation (steal the best, adapt to groceries)
| Source | Feature to adopt | GroceryView application |
|--------|------------------|--------------------------|
| **TradingView** | multi-timeframe charts (1W/1M/3M/1Y/ALL), crosshair value readout, compare-overlay, watchlist sparklines, screener, heatmap | product price charts; overlay two products/chains; chain/category price heatmap; "deal screener" (biggest drops, cheapest /kg) |
| **Investing.com** | technical "Buy/Sell" summary widget, economic calendar, news-tied-to-symbol, portfolio P/L | Deal-Score verdict widget; promo/seasonal calendar; "why did X move" notes; basket-as-portfolio savings |
| **CamelCamelCamel / Keepa** | price-history graph + "lowest in 30/90/365 days" + drop alerts | per-product price history + 52-week-low badge + watchlist drop alerts |
| **Google Flights / Skyscanner** | "prices currently low/high vs usual" + buy-now-vs-wait + price calendar | seasonal "buy now or wait" signal; price-vs-usual indicator |
| **Airbnb** | instant faceted search, synced map+list, beautiful cards, wishlist (save), trust badges, mobile-first | grocery search w/ filters (category, label, /kg, chain, in-stock); /map ↔ list sync; product cards; watchlist heart; data-freshness/confidence badges |
| **Robinhood** | approachable charts, portfolio value over time, delightful simple UX, push alerts | personal grocery-inflation curve; clean mobile charts; alert pushes |
| **Yuka** | scan → health/score | receipt/barcode scan → nutrition-per-krona + track real spend vs index |
| **Spotify / Netflix** | personalized "for you" rails | "deals for your watchlist", recommended swaps, seasonal picks |

### Full feature catalog (build toward all; real data + confidence only)
- **Markets / Index:** Grocery Index headline ticker; Chain Price Index + chart (compare chains over time); category & brand-tier sector indices; market heatmap; movers board (biggest weekly drops/rises).
- **Product / Ticker:** product page = ticker — price chart (multi-timeframe), 7-day %, 52-week low/high, volatility, unit price, labels; cross-chain price table (cheapest highlighted); Deal Score + Buy/Wait verdict; smart swaps; "lowest in N days" badge.
- **Compare:** cross-chain "who's cheapest now" per product + per basket; basket optimizer (single vs split shop); compare-overlay chart for 2+ items/chains.
- **Discover / Search:** instant faceted search (category, label, dietary, /kg range, chain, in-stock); full-taxonomy category browse; weekly offers/flyer deals by store (per-branch discounts); `/deals` screener.
- **Track / Alerts:** watchlist (follow products); price-target & %-drop alerts; weekly digest; notifications.
- **Personal:** personal grocery inflation (your CPI) + trend; basket cost trend; budget tracker; shopping lists with live totals; household sharing; receipt scanning → real-spend vs index; pantry replenishment; deal-based meal planner.
- **Map:** stores map + cheapest-near-me; markers colored by chain index; price-by-district heat; map↔list sync.
- **Content / Trust:** "why prices moved" notes; seasonal/promo calendar; data-freshness + confidence badges everywhere; source citations.

### UI/UX standard — "professional & beautiful" is a GATE, not a nice-to-have
- **Aesthetic:** financial-terminal clarity (TradingView/Robinhood) + Airbnb-grade polish — color-coded up/down (green/red), tickers, sparklines, dense-but-legible, generous whitespace. No generic scaffold look.
- **Charts:** use `lightweight-charts` (already a dependency) for price charts; sparklines on cards.
- **Design system:** consistent tokens (type scale, spacing, color), light + dark, reusable components.
- **Responsive & mobile-first** (groceries are a phone task); **accessible** (WCAG AA, keyboard, contrast); **fast** (skeleton states, no layout shift).
- **Honesty in UI:** every figure traces to real data; show coverage/confidence; missing inputs are derived from real cross-chain spread/unit prices and labelled, never invented. Brand/source colors are tokens, not ad-hoc.
- **Time-series features require the daily price DB** (see ingestion plan): charts may render from fixtures now but must swap to live DB observations — that price tape is what makes the index/terminal real.

## Consumer personas — who uses GroceryView and what they get

Build features through the eyes of real people in society. Each persona maps to
concrete, shippable features on top of the price-index engine. One persona-
feature = one PR; real data + confidence only. Workers: after the P1–P3
analytics items, pick the next unbuilt persona feature; tag PRs `feat(persona):`.

1. **Students / young singles** (tight budget, small portions): "cheapest basics" staples board across chains; single-portion deal finder; weekly budget tracker; recipes built from this week's deals.
2. **Families with kids** (value + planning): family-pack / bulk unit-price comparison; weekly family meal planner from deals; kids' snack & lunchbox deal feed; baby/diaper price tracking + alerts.
3. **Elderly / pensioners** (fixed income, simplicity, accessibility): large-text/high-contrast mode; staples price-stability view; fixed-income monthly budget; nearest-store + delivery options.
4. **Immigrants / non-native speakers** (language + familiar products): multilingual UI (top immigrant languages); halal/kosher/ethnic-aisle product finder; familiar-brand search; image-first browsing.
5. **Budget-conscious / low-income** (every krona counts): "lowest price anywhere" + cross-branch discount radar; "stretch your krona" basket optimizer; price-drop alerts on essentials; cheapest-store-for-my-list routing.
6. **Health & fitness** (nutrition value): nutrition-per-krona ranking; protein/calorie/macro optimizer; organic/Keyhole/vegan filters; high-protein deal finder.
7. **Busy professionals** (speed + convenience): one-tap basket optimization; saved baskets + auto-reorder; delivery-vs-store convenience comparison.
8. **Eco-conscious** (sustainability + waste): expiry/clearance deal radar (cut waste); local & seasonal picks; sustainable-brand filter; "cheaper + greener" suggestions.
9. **Meal-preppers / large households** (bulk + planning): bulk-buy unit-price optimizer; freezer/batch-cook planner from deals; multi-week list with price forecast.
10. **Deal-hunters / foodies** (discovery): new-product & price-drop alerts; specialty/premium tier tracking; "today's best deals" movers; watchlist with target prices.

Cross-cutting (every persona benefits, already engine-backed): cross-chain/branch price comparison, price-movement charts (the stock index), Buy/Wait deal signals, personal grocery inflation, watchlist alerts, store map. Each persona is a different *lens* on the same engine — surface the right view for the right person.

## Updated by operator only

The CEO MUST NOT edit this file. Only the operator (user or main Claude Code
session) updates `GOAL.md`. CEO requests new goals via
`[CEO->OPERATOR NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
