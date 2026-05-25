# Synthetic card-sort study: main navigation

Date: 2026-05-25  
Method: unmoderated synthetic card-sort simulation using 10 shopper personas. Each persona grouped 30 current or top-level GroceryView route labels into task-based piles, then named the piles in their own words. This is directional UX evidence for navigation restructuring; it is not production analytics or a substitute for moderated testing.

## Tested nav-item inventory (30 cards)

| # | Card label | Current route or surface | Notes |
| ---: | --- | --- | --- |
| 1 | Overview | `/` | Homepage / market terminal entry. |
| 2 | Products | `/products` | Product catalogue and verified rows. |
| 3 | Search | `/search` | Query-first product discovery. |
| 4 | Categories | `/categories` | Grocery category browsing. |
| 5 | Compare prices | `/compare` | Chain/product comparison. |
| 6 | Compare items | `/compare-items` | Item-to-item comparison. |
| 7 | Weekly basket | `/weekly-basket` | Basket quote and list baseline. |
| 8 | Basket ideas | `/basket-ideas` | Suggested baskets. |
| 9 | Shopping list | `/list` | Shared/check-off list. |
| 10 | Shopping trips | `/shopping-trips` | Trip-cost and route planning. |
| 11 | Deals | `/deals` | Broad offer discovery. |
| 12 | Expiry deals | `/expiry-deals` | Markdown/short-date offers. |
| 13 | Coupon stacks | `/coupon-stacks` | Member/promo stacking. |
| 14 | Unit-price alerts | `/unit-price-alerts` | Alert by unit value. |
| 15 | Watchlist | `/watchlist` | Saved price tracking. |
| 16 | Savings dashboard | `/savings-dashboard` | Personal savings/inflation view. |
| 17 | Meal planner | `/meal-planner` | Meal planning from products/deals. |
| 18 | Meal cost | `/meal-cost` | Recipe/meal cost breakdown. |
| 19 | Pantry planner | `/pantry-planner` | Replenishment planning. |
| 20 | Pantry inventory | `/pantry-inventory` | Owned household inventory. |
| 21 | Stores | `/stores` | Store directory. |
| 22 | Map | `/map` | Nearby/geographic shopping view. |
| 23 | Store coverage | `/store-coverage` | Coverage evidence by store/chain. |
| 24 | Chain index | `/chain-index` | Market-level chain index. |
| 25 | Price reports | `/price-reports` | Submitted/reporting workflows. |
| 26 | OpenPrices depth | `/openprices-depth` | Source-observation depth. |
| 27 | Data sources | `/data-sources` | Provenance and connector evidence. |
| 28 | Nutrition value | `/nutrition-value` | Nutrition per krona. |
| 29 | Seasonal calendar | `/seasonal-calendar` | Seasonal produce timing. |
| 30 | Account | `/account` | Profile, settings, privacy, exports. |

## Persona panel

| Persona | Primary shopping goal | Navigation bias observed in sort |
| --- | --- | --- |
| Budget-conscious weekly shopper | Spend less on staple baskets. | Groups by action: compare, basket, alerts, deals. |
| Family meal planner | Plan dinners and repeat pantry buys. | Expects meal, pantry, basket, and list to live together. |
| Student / young single | Find fast deals and simple trips. | Collapses compare, deals, and map into “today's cheapest option.” |
| Elderly / fixed income shopper | Predictable staples and nearby stores. | Wants fewer labels, larger “stores near me” and “my basket” choices. |
| Deal hunter / foodie | Browse promotions and seasonal finds. | Places coupons, expiry, seasonal, and meal inspiration in one discovery area. |
| Health & fitness shopper | Optimize nutrition per krona. | Sees nutrition as discovery/filtering, not a separate analytics product. |
| Parent managing shared household | Coordinate list, pantry, account, and weekly shop. | Groups account-like household controls with lists and pantry. |
| Rural / coverage-sensitive shopper | Know whether nearby stores have reliable data. | Groups stores, map, store coverage, and data sources tightly. |
| Market researcher / power user | Inspect index, reports, and source quality. | Creates an evidence/market-data cluster separate from shopping actions. |
| Newcomer to Sweden | Learn retailers, prices, and language/context. | Starts with stores/map/categories and avoids jargon like “OpenPrices depth.” |

## Aggregate clusters from the sort

| Synthetic cluster name | Cards most often grouped here | Personas agreeing | Interpretation |
| --- | --- | ---: | --- |
| **Shop and compare** | Products, Search, Categories, Compare prices, Compare items, Weekly basket | 9/10 | Core price-comparison tasks belong together; products/search/categories are perceived as one discovery funnel. |
| **Plan my basket** | Weekly basket, Basket ideas, Shopping list, Shopping trips, Meal planner, Meal cost, Pantry planner, Pantry inventory | 8/10 | People do not separate “basket,” “list,” “meal,” and “pantry” as much as current route names imply. |
| **Deals and alerts** | Deals, Expiry deals, Coupon stacks, Watchlist, Unit-price alerts, Savings dashboard, Seasonal calendar | 7/10 | Savings surfaces are mental siblings; the dashboard needs clearer “personal savings” wording. |
| **Stores near me** | Stores, Map, Store coverage, Shopping trips | 8/10 | Location, coverage, and trip planning should cross-link more strongly. |
| **Evidence and market data** | Chain index, Price reports, OpenPrices depth, Data sources, Store coverage | 6/10 overall; 10/10 for power users | These labels are valuable but feel secondary for everyday shopping; hide under an “Insights & sources” drawer on mobile. |
| **Health and seasonality** | Nutrition value, Seasonal calendar, Meal planner, Categories, Deals | 5/10 | Health shoppers use it as a lens inside product/deal discovery, while others treat it as inspiration. |
| **Account and household** | Account, Shopping list, Pantry inventory, Savings dashboard | 6/10 | Account is not just profile; it is where private/shared household state is expected. |

## Cards that did not fit users' mental models

| Card | Fit issue | Evidence from synthetic sort | Product risk | Recommendation |
| --- | --- | --- | --- | --- |
| **OpenPrices depth** | Source-system jargon. | 8/10 personas placed it in “admin/data” or left it aside; only the market researcher understood the destination. | Everyday shoppers may miss source transparency or think it is unrelated to prices. | Rename in nav to **Source depth** or place under **Insights & sources** with helper text “how much verified price evidence we have.” |
| **Chain index** | Sounds financial, not grocery-shopping. | 6/10 expected “chain index” to be a market report, not a cheapest-chain guide. | Useful index could be skipped by budget shoppers. | Present as **Cheapest chains** in shopper nav; keep “Grocery Index” as page heading/methodology term. |
| **Savings dashboard** | Ambiguous between coupons, personal inflation, and generic discounts. | 7/10 grouped it with deals, but 4/10 also expected account/private state. | Misclicks when users seek price drops or personal budget history. | Rename to **My savings** and place in an account-aware **Saved & alerts** area. |
| **Basket ideas** | Overlaps with Weekly basket and Meal planner. | 8/10 grouped it with weekly basket or meal planning; no persona made it a primary standalone category. | Users may not know whether it creates a list, suggests recipes, or compares totals. | Fold into **Meal & basket ideas** under **Plan** or use as a module on Weekly basket. |
| **Compare items** | Too similar to Compare prices. | 9/10 put both compare cards together; 5/10 questioned the difference. | Extra top-level item increases choice paralysis. | Use **Compare** top-level with tabs: “basket,” “products,” and “items.” |
| **Price reports** | Could mean analytics, user submissions, or downloadable reports. | Split between “evidence,” “account,” and “market insight” piles. | Users may expect personal reports and land in source/reporting workflows. | Rename route CTA to **Report a price** where it is a workflow; keep analytics under **Insights**. |
| **Store coverage** | Useful but unclear if it is a store finder or data-quality page. | Rural and power users valued it; most others grouped it with Data sources. | Coverage caveats may not be seen near store decisions. | Show coverage badges directly on **Stores** and **Map**; keep full page under sources. |
| **Nutrition value** | A filter/lens for some, standalone feature for others. | Health persona made it primary; 6/10 placed it inside products/deals/meal planning. | Standalone nav can hide nutrition affordance from product search. | Keep page, but add “nutrition value” filter chips to Deals, Products, and Meal planner. |

## Proposed navigation restructure

### Desktop information architecture

1. **Shop**
   - Products
   - Search
   - Categories
   - Compare
   - Weekly basket
2. **Plan**
   - Shopping list
   - Meal & basket ideas
   - Pantry
   - Shopping trips
3. **Save**
   - Deals
   - Expiry deals
   - Coupons
   - Watchlist
   - Unit-price alerts
   - My savings
4. **Stores**
   - Nearby map
   - Store directory
   - Coverage badges
5. **Insights & sources**
   - Cheapest chains / Grocery Index
   - Source depth
   - Data sources
   - Report a price
   - Store coverage detail
6. **Account**
   - Profile and settings
   - Household sharing
   - Privacy/export/delete

### Mobile primary tabs

| Tab | Why | First-level destinations |
| --- | --- | --- |
| **Shop** | Highest agreement cluster; supports product and compare entry. | Products, Search, Categories, Compare, Weekly basket. |
| **Deals** | Strong quick-action label for budget, student, and deal personas. | Deals, Expiry, Coupons, Watchlist, Alerts. |
| **Plan** | Reduces basket/list/meal/pantry fragmentation. | List, Weekly basket, Meal ideas, Pantry, Trips. |
| **Stores** | Matches geographic mental model and accessibility needs. | Map, Stores, coverage badges. |
| **Account** | Private state and household controls. | Account, My savings, household list sharing. |

Move **Insights & sources** behind a secondary drawer/link from Shop, Stores, and Account rather than showing all market-data surfaces as equal top-level choices on narrow screens.

## Actionable UX tickets

| Priority | Ticket seed | Acceptance signal |
| --- | --- | --- |
| P1 | Rename shopper-facing **Chain index** nav label to **Cheapest chains** while preserving methodology copy on the page. | Budget and newcomer personas select it for cheapest-chain tasks in the next first-click pass. |
| P1 | Merge **Compare prices** and **Compare items** into one **Compare** entry with clear tabs/cards. | Users can distinguish basket compare, product compare, and item compare from one landing page. |
| P1 | Create a **Plan** group that combines Weekly basket, Shopping list, Meal planner, Meal cost, Basket ideas, Pantry, and Shopping trips. | Basket/list/meal tasks no longer scatter across three nav areas. |
| P2 | Move OpenPrices depth, Data sources, Price reports, and Store coverage detail under **Insights & sources**. | Mobile nav shows fewer than six primary destinations while source pages remain discoverable from evidence badges. |
| P2 | Rename **Savings dashboard** to **My savings** and cross-link it from Watchlist and Account. | Users seeking personal savings do not confuse it with public deal browsing. |
| P2 | Add coverage/source badges to Stores, Map, Products, and Deals cards. | Store coverage caveats appear where purchase decisions happen, not only in source pages. |
| P3 | Add Nutrition value as a filter/lens in Products, Deals, and Meal planner. | Health tasks start from common discovery surfaces and still reach the dedicated nutrition page. |

## Recommended next validation

Run a lightweight tree test with the same 10 tasks used in `docs/ux/first-click.md` against the proposed labels: **Shop**, **Deals**, **Plan**, **Stores**, **Insights**, and **Account**. Treat a task as passing when at least 7 of 10 participants choose the intended top-level group without needing helper text.
