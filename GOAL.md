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

## Feature backlog — surface the analytics engine (operator priority, 2026-05-21)

`@groceryview/core` already exports ~41 TESTED analytics functions; the web app
imports only ~4. The biggest visible-value lever now is **wiring real core
analytics into the already-scaffolded routes** (`/compare`, `/meal-planner`,
`/savings-dashboard`, `/watchlist`, `/pantry-planner`, `categories/[slug]`,
`products/[slug]`). Each item = one feature = one PR.

**Hard rules for every backlog item:**
- Import and call the REAL core function — never reimplement, stub, or hardcode it.
- **No fabricated numbers.** If an input is missing (e.g. price history for a
  percentile), derive it from data we actually have (cross-chain spread, unit
  prices) and show a coverage/confidence indicator — never invent values. Same
  discipline as the shipped `calculateChainPriceIndex`.
- Reach a driver file / visible route (Visible-Artifact gate applies).
- Build + typecheck must pass; extend a core test if you touch core.

### P1 — highest visible value
1. **Deal score + verdict on `products/[slug]`** — `calculateDealScore` + `scoreBand`
   ("Excellent deal / Buy now" … "Not a real deal / Wait"). Where full history is
   missing, derive percentiles from the cross-chain price spread and mark
   confidence. The "real-deal detector".
2. **Cheapest-chain-per-product** — use the cross-chain matched products (#531
   Willys↔Hemköp) on `products/[slug]` and `/compare`; show each chain's price and
   highlight the cheapest.
3. **Category deal leaders** — `summarizeCategoryDealLeaders` on `categories/[slug]`
   and a "Today's best deals" strip on `/`.
4. **Personal grocery inflation** — `calculatePersonalGroceryInflation` on
   `/savings-dashboard` (a personal CPI for the visitor's basket).
5. **Smart swaps** — `recommendSmartSwaps` on `products/[slug]`.

### P2
6. **Nutrition per krona** — `rankNutritionPerKrona`.
7. **Expiry deal radar** — `buildExpiryDealRadar` on `/deals`.
8. **Watchlist price alerts** — `buildWatchlistAlerts` + `planNotifications` on `/watchlist`.
9. **Basket optimizer** — `compareBasketStrategies` + `summarizeStoreBasketCoverage` on `/weekly-basket`.
10. **Deal-based meals** — `suggestDealBasedMeals` on `/meal-planner`.
11. **Pantry replenishment** — `planPantryReplenishment` on `/pantry-planner`.
12. **Brand-tier index** — `calculateBrandTierIndices` (budget vs premium) on `/chain-index`.

### P3 — map + index tie-ins
13. Colour `/map` markers by their chain's `/chain-index` score; "cheapest chain near me".
14. Price-by-district heat overlay on `/map`.
15. Matched-basket refinement for `calculateChainPriceIndex` via cross-chain matches.

Already shipped this sprint (regression bars): `/map` (#575), `/chain-index` (#583).

## Updated by operator only

The CEO MUST NOT edit this file. Only the operator (user or main Claude Code
session) updates `GOAL.md`. CEO requests new goals via
`[CEO->OPERATOR NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
