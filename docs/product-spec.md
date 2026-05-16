# GroceryView Stockholm Launch Product Specification

**Lane:** Product Manager (Pane 1)  
**Source:** `PROPOSAL.md` v0.2 — TradingView-style market terminal emphasis  
**Launch market:** Stockholm, Sweden  
**Platforms:** Responsive web, Android, iOS  
**Document purpose:** Define the Stockholm MVP feature set, user stories, and prioritized roadmap.

---

## 1. Product Vision

GroceryView helps Stockholm shoppers track grocery prices like market instruments so they can decide what to buy, where to buy it, and whether a deal is real. The MVP must prove that users want grocery price intelligence beyond simple price comparison by combining:

- Current supermarket prices and promotions.
- Product price history and charts.
- Favorite stores and watchlists.
- Weekly Basket planning and budget tracking.
- Deal Score v1 and basket comparison across selected stores.

The product should feel like **TradingView for groceries** while remaining approachable for weekly grocery planning.

### User-facing promise

> Know when to buy, where to buy, and whether a supermarket deal is real.

---

## 2. MVP Goals and Success Criteria

### 2.1 MVP goal

Launch a useful Stockholm-focused web and mobile product that lets users:

1. Search tracked grocery products.
2. Compare current prices across selected Stockholm stores/chains.
3. See basic price history and Deal Score v1.
4. Save favorite stores and products.
5. Build a Weekly Basket, estimate total cost, and compare basket strategies.
6. Track weekly/monthly grocery budget and receive basic alerts.

### 2.2 Target launch scope

- **Geography:** Stockholm only.
- **Chains:** Start with ICA, Willys, Coop, Hemköp, Lidl where data is available; architecture should allow City Gross and additional chains later.
- **Catalog target:** 500 high-frequency products for launch readiness.
- **Initial categories:** dairy, eggs, coffee, meat, pantry, bread, fruit/vegetables, frozen, baby, cleaning, household paper.
- **Hero products:** milk, eggs, butter, coffee, chicken, minced beef, pasta, rice, bread, cheese, bananas, tomatoes, potatoes, toilet paper, detergent, diapers, oat milk, yogurt, olive oil, frozen pizza.

### 2.3 Success metrics

**Activation and utility**
- Account-created-to-first-favorite-store rate.
- Favorite stores per active user.
- Watchlist items per active user.
- Weekly Baskets created per active user.
- Basket comparisons run per active user.
- Budget trackers enabled.

**Retention and engagement**
- Weekly active users.
- 4-week retention.
- Alert click-through rate.
- Repeat product searches.
- Product page chart interactions.

**Data quality**
- Products tracked.
- Stores tracked.
- Daily price observations.
- Promotion observations.
- Product match accuracy.
- Average price confidence score.
- Category coverage.

**Business readiness**
- Ad impressions from clearly labelled free-tier placements.
- Premium waitlist/conversion interest.
- SEO traffic to product/store/category pages.

---

## 3. Target Users and Primary Jobs

### 3.1 Budget-conscious households

**Job:** Keep weekly food spending under control without manually comparing multiple supermarket apps.  
**Value:** Budget tracker, Weekly Basket, basket comparison, Deal Score.

### 3.2 Students

**Job:** Find cheap staples and avoid overspending.  
**Value:** Hero products, budget mode, private-label options, watchlist alerts.

### 3.3 Deal hunters

**Job:** Know when a deal is genuinely exceptional, not just advertised.  
**Value:** Deal Score, price history, 52-week lows, favorite-store alerts.

### 3.4 Busy professionals

**Job:** Quickly plan a basket around favorite stores without over-optimizing travel.  
**Value:** Favorite stores, quick recommendations, buy/wait guidance, selected-store comparison.

### 3.5 Families with babies or fixed recurring needs

**Job:** Track high-frequency and high-cost recurring products.  
**Value:** Watchlist, target price alerts, weekly/monthly budget, category tracking.

---

## 4. Product Principles for MVP

1. **Do not optimize for travel time.** Show store distance and filters if available, but do not penalize deals for being far away. The user chooses scope: favorite stores, selected chains, area, district, or radius.
2. **Price trust must be visible.** Show last updated time, source type/confidence, and verified/estimated labels.
3. **Charts are core, not decoration.** Product pages must include a basic price history chart and market-style metrics.
4. **Keep simple mode usable.** Default to practical labels such as “Buy now”, “Good deal”, “Normal price”, and “Wait”; advanced percentiles/charts remain available.
5. **Ads never affect rankings.** Sponsored placements must be labelled and must not affect Deal Score, best-price ranking, or budget warnings.
6. **Exact vs equivalent matters.** Do not silently compare different products; clearly label exact matches, equivalent products, and private-label substitutions.

---

## 5. MVP Feature Set

### P0 — Required for Stockholm launch

#### 5.1 User account and onboarding

**Description**  
Users create an account, select Stockholm as launch city, choose preferred language/currency defaults, save favorite stores, set budget, and choose private-label/member-price preferences.

**Must have**
- Email/social sign-in or equivalent account creation.
- Home area/work area optional settings.
- Favorite store selection during onboarding.
- Weekly and monthly budget settings.
- Preferences: include member prices, accept private label, notification preferences.

**User stories**
- As a Stockholm shopper, I want to save my preferred stores so the app highlights deals I can actually use.
- As a budget-conscious user, I want to set a weekly budget during onboarding so every basket shows budget impact.

**Acceptance criteria**
- A new user can create an account, choose at least one favorite store, set a weekly budget, and reach the Today Dashboard.
- User settings can be edited after onboarding.

---

#### 5.2 Favorite Stores / My Stores

**Description**  
Users save Stockholm supermarkets they care about and filter price/deal views around those stores.

**Must have**
- Store list and store detail pages.
- Store metadata: chain, name, address, district, opening hours when available, last updated time, confidence level.
- Favorite labels: home store, work store, big shopping store, favorite, occasional deal store.
- Filters by favorite stores, chain, district, category, member-only deals, private-label inclusion, verified prices.

**User stories**
- As a user, I want to save Willys Odenplan and Lidl Sveavägen so my dashboard shows relevant deals first.
- As a user, I want to filter by favorite stores only so I do not see irrelevant offers.

**Acceptance criteria**
- A signed-in user can add/remove favorite stores.
- Product, deal, watchlist, and basket views can be scoped to favorite or selected stores.
- Distance may be displayed when known, but it does not reduce savings or Deal Score.

---

#### 5.3 Product Search and Product Price Terminal

**Description**  
Every tracked product has a market-style product page with current prices, price history, Deal Score, unit price, and watchlist controls.

**Must have**
- Search by product name, brand, category, and barcode value when available.
- Product detail page with current best price, median price, unit price, store prices, 7D/30D change when data exists, 52-week range when data exists, last verified time, source confidence.
- Basic price chart with 7D, 30D, 90D, 1Y where data exists.
- Store price table.
- Equivalent product section.
- Watchlist button.

**User stories**
- As a shopper checking coffee, I want to see current prices and history so I know if today is a good time to buy.
- As a user, I want unit prices shown consistently so I can compare different package sizes.

**Acceptance criteria**
- Search returns tracked products from the Stockholm catalog.
- Product page displays current prices by store and at least one chart view when history exists.
- Price confidence and last updated time are visible.

---

#### 5.4 Deal Score v1

**Description**  
A transparent score explaining whether a current price/promotion is actually good.

**MVP formula**

```text
Deal Score v1 =
40% current city percentile
+ 25% known promo history
+ 20% unit price vs equivalent products
+ 10% discount depth
+ 5% source confidence
```

**Score bands**
- 90–100: Excellent deal.
- 75–89: Good deal.
- 60–74: Fair deal.
- 40–59: Normal price.
- 0–39: Not a real deal.

**Must have**
- Numeric score.
- Plain-language verdict.
- “Why this score?” explanation.
- Source-confidence note.
- Ads/sponsored placements excluded from score calculation.

**User stories**
- As a deal hunter, I want a score that uses history and city context so I can avoid fake promotions.
- As a skeptical user, I want the app to explain the score so I can trust it.

**Acceptance criteria**
- Every deal card and product page with enough data shows Deal Score v1 or an explicit “insufficient data” state.
- Sponsored status never changes Deal Score.

---

#### 5.5 Favorite Products / Watchlist and Basic Alerts

**Description**  
Users track frequently purchased products/categories and receive basic alerts when conditions are met.

**Must have**
- Add/remove product or category watchlist items.
- Target price.
- Preferred brands.
- Accept private label yes/no/maybe.
- Favorite stores only yes/no.
- Alert thresholds for target price reached, favorite-store offer, Deal Score above threshold, basket total drop.

**User stories**
- As a coffee buyer, I want an alert when coffee is under 50 SEK at one of my stores.
- As a parent, I want diaper alerts so I can stock up before prices rise.

**Acceptance criteria**
- User can create and edit watchlist items.
- Dashboard shows watchlist matches.
- Basic notification settings can turn alerts on/off.

---

#### 5.6 Today Dashboard / Market Overview

**Description**  
The home screen summarizes what matters this week: budget, basket, favorite-store deals, watchlist alerts, recent price drops, and recommended actions.

**Must have**
- Weekly budget summary.
- Saved stores summary.
- Top deals from favorite/selected stores.
- Watchlist alerts.
- Link to Weekly Basket.
- Recent price drops or “market movers”.
- Simple recommendations such as buy/wait/compare.

**User stories**
- As a returning user, I want to open the app and immediately see what is worth buying this week.
- As a budget-focused shopper, I want dashboard budget status before I go shopping.

**Acceptance criteria**
- Dashboard loads for signed-in users and reflects their favorite stores, watchlist, basket, and budget.
- Empty states guide new users to add stores/products/budget.

---

#### 5.7 Weekly Basket

**Description**  
A weekly shopping list that estimates cost, compares selected stores, and shows budget impact.

**Must have**
- Create basket/list.
- Add/remove items manually and from product/deal pages.
- Quantity and preferred brand/flexible setting.
- Mark items bought.
- Estimated total.
- Budget remaining.
- Buy/wait recommendation when data exists.
- Missing-price state.
- Basic substitutions.

**User stories**
- As a user, I want to build this week’s shopping list so I know expected cost before shopping.
- As a user, I want items marked flexible so the app can suggest cheaper equivalent options.

**Acceptance criteria**
- User can create a basket, add at least one item, see estimated total, and mark item bought.
- Basket total updates when quantities or substitutions change.

---

#### 5.8 Budget Tracker

**Description**  
Budget tracking helps users plan, monitor, and review grocery spending.

**Must have**
- Weekly budget setting.
- Monthly budget setting.
- Basket estimate vs weekly budget.
- In-store running total for marked/added items.
- Receipt total entry or receipt scan output integration when P1 is added.
- Over/under budget summary.

**User stories**
- As a household shopper, I want to know if my planned basket fits within 800 SEK this week.
- As a student, I want a running total so I do not overspend in-store.

**Acceptance criteria**
- Basket estimate and budget remaining are visible on dashboard and basket page.
- User can update budget values and see recalculated remaining amount.

---

#### 5.9 Basket Comparison Engine

**Description**  
Compare shopping strategies across selected/favorite stores without optimizing or penalizing by travel time.

**Must have**
- Buy all from one selected store.
- Buy from favorite stores only.
- Buy cheapest by product across selected stores.
- Buy with private-label substitutions if user allows.
- Respect brand-locked items.
- Max stores setting: 1, 2, 3, unlimited.
- Savings breakdown.

**User stories**
- As a shopper, I want to compare “all at Willys” vs “Willys + Lidl” so I can decide if splitting the trip is worth it.
- As a user who dislikes substitutions, I want brand-locked items respected.

**Acceptance criteria**
- Basket comparison returns at least two strategy options when data exists.
- Results show total estimated cost, stores used, missing prices, and savings breakdown.
- Travel time/distance does not reduce score or savings.

---

#### 5.10 Exact, Equivalent, and Basic Private-Label Comparison

**Description**  
Users can distinguish exact product matches from equivalent products and private-label alternatives.

**Must have**
- Exact match: same product/brand/size/barcode when possible.
- Equivalent match: same functional category and similar size.
- Smart swap light: only clear, high-confidence categories for MVP.
- User preferences for private label and budget private label.
- Substitution confidence label.

**User stories**
- As a user, I want to know when Barilla spaghetti is being compared with private label spaghetti so I can decide if that is acceptable.
- As a budget user, I want the app to show private-label savings for staples.

**Acceptance criteria**
- Basket and product pages clearly label exact/equivalent/private-label comparisons.
- Baby formula, medical diet items, and sensitive pet food categories are not auto-substituted.

---

#### 5.11 Store Deal Feed

**Description**  
A feed of current deals from selected stores/chains, ranked organically by relevance and Deal Score.

**Must have**
- Filter by favorite stores, chain, category, member-only inclusion, private-label inclusion, verified-only.
- Deal cards with price, unit price, Deal Score, source confidence, last updated time.
- Add to basket/watchlist actions.
- Clearly labelled sponsored placements if ads are enabled.

**User stories**
- As a user, I want to browse my favorite stores’ best deals this week.
- As a user, I want to hide member-only deals if I cannot use them.

**Acceptance criteria**
- Deal feed supports filtering and sorting by Deal Score/current price/category.
- Sponsored placements are visually distinct and do not alter organic ranking.

---

#### 5.12 Website Market, Product, Store, and Category Pages

**Description**  
SEO-friendly web pages expose GroceryView’s market intelligence and support acquisition.

**Must have**
- Stockholm market overview page.
- Product pages.
- Store pages.
- Category pages.
- Basic index cards for required MVP indices where data exists.
- Responsive design.

**User stories**
- As a web visitor, I want to find a product price page from search and understand whether the price is good.
- As a returning user, I want web and mobile to show consistent price intelligence.

**Acceptance criteria**
- Pages render on mobile and desktop.
- Product/store/category pages show confidence/last updated states.

---

#### 5.13 MVP Grocery Indices

**Description**  
Launch with a small set of market-style indices to demonstrate the TradingView concept.

**Required MVP indices**
- Stockholm Grocery Index.
- Stockholm Coffee Index.
- Stockholm Dairy Index.
- Stockholm Protein Index.
- Budget Basket Index.
- My Stores Basket Index.
- Private Label Index.

**User stories**
- As a user, I want to know whether coffee is getting cheaper or more expensive across Stockholm.
- As a user, I want my selected stores summarized as a personal mini-market.

**Acceptance criteria**
- Index pages/cards show current value, change over available period, confidence, and methodology note.
- If data is thin, index displays limited-confidence state rather than overclaiming accuracy.

---

#### 5.14 Free-tier ad-ready layout and trust rules

**Description**  
The MVP can support free-tier ad placements without compromising trust.

**Must have**
- Clearly labelled sponsored/native ad containers.
- No ads in critical decision areas: Deal Score explanation, barcode result top area, budget warnings, checkout-style basket comparison.
- No use of receipt data/private budget data for advertisers.

**User stories**
- As a user, I want to know which offers are sponsored so I can trust organic recommendations.

**Acceptance criteria**
- Ad slots are visually labelled.
- Organic ranking and Deal Score remain independent of sponsorship.

---

### P1 — Daily utility after launch foundation

1. **Barcode scan** — scan products in store; show current store price if known, other store prices, chart, Deal Score, equivalents, add-to-basket/watchlist.
2. **Receipt scan** — extract store/date/items/total/discounts/member prices; summarize spend vs budget and possible savings.
3. **Personal grocery inflation** — compare user basket and receipt history over time.
4. **Household sharing** — shared basket, budget, watchlist, favorite stores, who-added-what.
5. **Advanced private-label smart swaps** — category-specific substitution logic beyond obvious staples.
6. **Nutrition per krona** — protein/calories/fiber per SEK and healthier alternative insights.
7. **Deal-based meal planning** — meal suggestions based on current deals and budget.
8. **Community verification light** — wrong price reports, receipt/shelf confirmation, contributor reputation seed.

### P2 — Data moat and expansion features

1. Yellow sticker / expiry deal radar.
2. Pantry management.
3. Advanced grocery indices and heatmaps.
4. SEO price pages at scale and newsletter.
5. B2B analytics beta/dashboard.
6. API access.
7. Multi-city expansion template.

---

## 6. Core User Stories by Journey

### 6.1 First-run setup

- As a new Stockholm user, I want to choose my favorite stores so the app does not show irrelevant deals.
- As a new user, I want to set my weekly budget so the app can show whether a basket fits my plan.
- As a new user, I want to choose whether I accept private-label products so substitutions match my preferences.

### 6.2 Weekly planning

- As a weekly shopper, I want to create a basket from search, deals, and previous items so I can plan faster.
- As a weekly shopper, I want to see estimated basket total and budget remaining before I go shopping.
- As a shopper, I want to compare all-at-one-store vs split-store options so I can decide my strategy.
- As a shopper, I want missing prices clearly shown so I know where the estimate is uncertain.

### 6.3 Product check

- As a shopper, I want to search or scan a product and see if its current price is high or low.
- As a shopper, I want to view price history so I can decide whether to buy now or wait.
- As a shopper, I want unit price and equivalent products so I can compare package sizes and substitutes.

### 6.4 Deal hunting

- As a deal hunter, I want top price drops and 52-week lows in Stockholm so I can stock up intelligently.
- As a user, I want alerts when watchlist products hit my target price or a high Deal Score.
- As a user, I want to filter out member-only deals if I cannot access them.

### 6.5 Budget control

- As a budget-conscious user, I want a running total while shopping so I can avoid overspending.
- As a user, I want the app to identify categories/items causing overspend.
- As a user, I want a monthly view so I can see whether weekly choices are adding up.

### 6.6 Trust and correction

- As a user, I want to see when a price was last verified so I do not rely on stale data.
- As a user, I want to report a wrong price so the app becomes more accurate.
- As a user, I want sponsored offers labelled so I understand what is organic.

---

## 7. MVP Information Architecture

### Web and app primary navigation

1. **Today** — dashboard and market overview.
2. **Search** — product/category search.
3. **Deals** — selected/favorite-store deal feed.
4. **Basket** — Weekly Basket and comparison.
5. **Watchlist** — favorite products/categories and alerts.
6. **Stores** — favorite stores and store profiles.
7. **Budget** — weekly/monthly budget and spend summary.
8. **Settings** — preferences, notifications, privacy, account.

### Key object pages

- Product Price Terminal.
- Store profile.
- Category page.
- Index page.
- Basket strategy comparison.

---

## 8. Launch Roadmap

### Phase 0 — Definition and data readiness (Weeks 0–2)

**Outcome:** MVP scope is locked; Stockholm data seed plan is ready.

**Priorities**
1. Confirm launch chains and initial store list for Stockholm.
2. Finalize 500-product catalog seed with hero categories.
3. Define product matching rules: exact, equivalent, private-label.
4. Define Deal Score v1 calculation and confidence thresholds.
5. Define MVP index methodology and limited-confidence states.
6. Define privacy/ad trust rules.

**Exit criteria**
- Product catalog schema and seed list approved.
- Store database source identified.
- MVP scope accepted as P0/P1/P2.

### Phase 1 — Stockholm MVP build (Months 0–3)

**Outcome:** Public beta-ready web + mobile MVP for Stockholm.

**P0 build order**
1. Data models: products, stores, prices, promotions, users, preferences, watchlist, basket, budget.
2. User account and onboarding.
3. Store database and favorite stores.
4. Product catalog and search.
5. Price observation storage and current price APIs.
6. Product Price Terminal with basic charts.
7. Deal Score v1 and deal feed.
8. Watchlist and basic alerts.
9. Weekly Basket.
10. Budget tracker.
11. Basket comparison engine.
12. Exact/equivalent/private-label display.
13. Website market/product/store/category pages.
14. Ad-ready layout and trust labels.
15. MVP indices/cards.

**Launch beta gates**
- At least 500 products and enough store coverage to make basket comparison useful.
- Core pages load on responsive web, Android, and iOS.
- Price confidence and last-updated labels are present wherever prices appear.
- Dashboard, product page, basket, budget, stores, and watchlist complete P0 acceptance criteria.
- Sponsored/ad containers are labelled and excluded from rankings.

### Phase 2 — Daily utility expansion (Months 3–6)

**Outcome:** Increase repeat usage and data quality.

**Priorities**
1. Barcode scan.
2. Receipt scan and spend review.
3. Household sharing.
4. Personal grocery inflation.
5. Better alerts and notification tuning.
6. Advanced private-label smart swaps.
7. Nutrition per krona.
8. Basic meal planning from deals.
9. More Stockholm stores/products and improved category coverage.

**Success focus**
- Increase 4-week retention.
- Increase weekly baskets created.
- Increase receipt/scan observations for data moat.

### Phase 3 — Data moat and growth (Months 6–12)

**Outcome:** Build defensibility through community data, SEO, and analytics.

**Priorities**
1. Community verification and contributor reputation.
2. Yellow sticker / expiry deal radar.
3. Advanced grocery indices and category heatmaps.
4. SEO price pages at scale.
5. Newsletter/weekly market report.
6. Pantry tracking.
7. B2B analytics beta.

**Success focus**
- More verified observations.
- Improved product match accuracy.
- Organic web acquisition.
- Early B2B leads.

### Phase 4 — Expansion (12+ months)

**Outcome:** Repeat the city launch playbook outside Stockholm.

**Priorities**
1. Gothenburg and Malmö.
2. Nordic expansion: Oslo, Copenhagen, Helsinki.
3. Paid data partnerships and retailer partnerships.
4. B2B dashboard and API access.
5. International city template.

**Expansion readiness gates**
- City-independent data model validated.
- Localization supports country/city/currency/language/tax/VAT/member pricing/private label differences.
- Stockholm retention and data coverage justify replication.

---

## 9. Explicit Non-goals for MVP

- No travel-time optimization or automatic distance penalty in savings/Deal Score.
- No claim of complete Stockholm price coverage at launch.
- No advanced yellow-sticker radar in P0.
- No full B2B dashboard in P0.
- No multi-city expansion before Stockholm MVP proves retention and data quality.
- No opaque substitutions; every equivalent/private-label comparison must be labelled.
- No ad influence on Deal Score, best-price ranking, or budget recommendations.

---

## 10. Open Product Questions

1. Which exact Stockholm stores should be included in the launch seed for each chain?
2. Which retailer data sources are reliable enough for launch, and what legal constraints apply?
3. What minimum observation freshness is acceptable by category before showing a price as current?
4. What notification volume avoids alert fatigue while still driving weekly utility?
5. Should the first beta require sign-in before browsing, or allow anonymous web exploration with sign-in for saved features?
6. Which language should be default for Stockholm launch: English, Swedish, or device preference?

---

## 11. Launch Definition of Done

GroceryView Stockholm MVP is launch-ready when:

- Users can complete onboarding, save favorite stores, set budgets, and add watchlist items.
- Users can search hero products and see Product Price Terminal pages with current prices, unit price, Deal Score, confidence, and basic price chart.
- Users can build a Weekly Basket, estimate total, compare selected/favorite-store strategies, and view budget remaining.
- Users can browse a store deal feed filtered by favorite stores/chains/categories.
- Users can access responsive web pages for market, products, stores, and categories.
- Basic Stockholm indices are visible with confidence labels and transparent methodology.
- Alerts exist for target price/favorite-store/high-Deal-Score conditions.
- Sponsored/ad-ready placements are clearly labelled and isolated from organic ranking.
- All prices show last updated/confidence state.
- Travel time is not used as a deal penalty.
