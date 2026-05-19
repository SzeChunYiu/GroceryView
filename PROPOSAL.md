# GroceryView Detailed Product Proposal

**Version:** v0.2 — TradingView-style market terminal emphasis

**Project codename:** GroceryView  
**Tagline:** Track grocery prices like stocks. Know when to buy, where to buy, and whether a deal is real.  
**Target platforms:** Website, Android app, iOS app  
**Initial launch market:** Stockholm, Sweden  
**Expansion vision:** City-by-city grocery price intelligence platform for multiple countries

---

## 1. Executive Summary

GroceryView is a grocery price intelligence platform that helps users plan weekly grocery shopping, track supermarket prices, compare real deals, manage budgets, and make smarter purchase decisions.

The product should not be positioned as only a price comparison app. It should be positioned as a daily and weekly grocery companion that combines:

- Local supermarket prices
- Favorite supermarkets
- Weekly shopping list planning
- Budget tracking
- Product price history
- Deal scoring
- Watchlists and alerts
- Basket comparison
- Private label substitution
- Receipt analytics
- Grocery price indices
- Household sharing
- Community verification

The core concept is: **TradingView for groceries**, supported by Keepa-style price history, Flipp-style local offers, Yuka-style scan clarity, and Bring!-style weekly household lists.

The user should be able to answer practical daily questions:

- What is cheap near me this week?
- What are my favorite supermarkets offering?
- Is this supermarket deal actually good?
- Should I buy now or wait?
- Can I stay within my weekly grocery budget?
- What should I buy this week?
- Which private label alternatives are worth switching to?
- Which items on my watchlist are below target price?
- How much did I overspend or save after scanning my receipt?

---

## 2. Important Product Decision: Do Not Optimize for Travel Time

Earlier versions considered traffic time and transportation cost. This proposal removes that as a core optimization variable.

Many users are willing to travel far to buy groceries if the savings are meaningful. Therefore, GroceryView should not penalize long-distance shopping by default.

Instead, the product should provide filters and choices:

- Nearby stores
- Favorite stores
- Home area
- Work area
- Selected radius
- Selected city district
- Selected supermarket chains
- Stores user manually chooses

The app should show the best prices and best deals within the selected scope. The user decides whether the trip is worth it.

### Correct approach

```text
Show me the cheapest and best-value options within my selected stores / area.
```

### Avoid

```text
Do not automatically reduce the saving score because a store is far away.
Do not assume travel time makes a deal worse.
```

Distance can still be displayed as information, but it should not be a primary decision penalty in MVP.

---

## 3. Product Positioning

### Simple user-facing positioning

GroceryView helps people shop smarter every week by showing supermarket prices, real deals, weekly budgets, and price history in one place.

### Investor / business positioning

GroceryView is a data layer and decision engine for grocery shopping, starting with Stockholm and expanding city by city.

### Developer / product positioning

A cross-platform grocery intelligence product with:

- Structured product catalog
- Store-level price observations
- Promotion tracking
- Historical price charts
- Deal scoring engine
- Weekly basket planner
- Budget tracker
- Mobile scanning tools
- Web dashboard and SEO price pages


---

## 4. TradingView-style Product Requirement

GroceryView must feel like a market terminal for groceries, not only a normal supermarket price comparison app.

The visual language, information architecture, and interaction model should borrow from products like TradingView, Yahoo Finance, Bloomberg-style dashboards, and price-tracking tools such as Keepa.

### Core principle

```text
Every product, category, supermarket, and basket can behave like a market instrument.
```

Examples:

```text
ARLA-MILK-1L
COFFEE-STHLM-IDX
DAIRY-WILLYS-STHLM
BUDGET-BASKET-ODENPLAN
ICA-NARA-ODENPLAN-PRICE-LEVEL
```

This allows the app to support:

- Product ticker pages
- Category price indices
- Supermarket indices
- Watchlists
- Price alerts
- Sector heatmaps
- Grocery screeners
- Historical charts
- Percentile analysis
- Top movers
- Market reports

### TradingView-style modules

#### 1. Market Overview

The home screen should show a live grocery market overview:

```text
Stockholm Grocery Market

Top Losers / Biggest Price Drops
Top Gainers / Biggest Price Increases
52-week lows
Best true deals
Category heatmap
Chain comparison
Favorite-store movers
Watchlist alerts
```

#### 2. Product Ticker Page

Each product page should look like a financial instrument page.

```text
ZOEGAS-COFFEE-450G
Current best price: 49.90 SEK
7D: -12.4%
30D: -8.1%
Historical percentile: 6th
Stockholm current percentile: 11th
52W range: 44.90 - 79.90 SEK
Deal Score: 94
Verdict: Buy now
```

Required tabs:

```text
Overview
Chart
Stores
Equivalent Products
Smart Swaps
Price History
Nutrition Value
Community Verification
```

#### 3. Chart-first experience

Charts are not optional decoration. They are part of the core product.

Charts should support:

- 7D, 30D, 90D, 1Y, All
- Line chart for exact product price
- Area chart for category index
- Multi-line comparison between chains
- Store-level comparison
- Percentile band overlay
- 52-week high / low markers
- Promotion markers
- Member-price markers
- Verified vs estimated data styling

Recommended convention:

```text
Solid line = verified observed prices
Dotted line = estimated / promo-only history
Marker = promotion event
Shaded band = normal price range
```

#### 4. Watchlist panel

Users should be able to build a grocery watchlist similar to a stock watchlist.

Columns:

```text
Product
Best price
Favorite-store price
7D change
30D change
Stockholm percentile
Historical percentile
Deal Score
Alert status
```

Example:

```text
Coffee        49.90   -12.4%   6th percentile    Deal 94
Butter        54.90   +2.1%    58th percentile   Wait
Eggs          34.90   -4.2%    22nd percentile   Fair
Toilet paper  69.90   -18.0%   4th percentile    Stock up
```

#### 5. Grocery Screener

A grocery screener is one of the strongest TradingView-style differentiators.

Users can filter products by:

```text
Category
Supermarket chain
Favorite stores only
Selected district / area
Deal Score
Historical percentile
Current Stockholm percentile
7D / 30D price change
Unit price
Private label / branded / organic
Member price excluded or included
Source confidence
In stock / verified
Budget relevance
```

Example screeners:

```text
52-week lows
Best deals near my favorite stores
Coffee below 20th percentile
Protein deals under 80 SEK/kg
Budget private label bargains
Non-member true deals
Baby products on discount
High-confidence verified prices only
```

#### 6. Sector heatmap

The app should include a grocery sector heatmap similar to a market heatmap.

Example:

```text
Dairy       +2.1%
Coffee      -8.4%
Meat        -1.3%
Vegetables  +4.7%
Baby        +0.6%
Cleaning    -5.2%
```

Tiles can be colored by price movement, Deal Score density, or inflation pressure.

#### 7. Price alerts

Alerts should work like market alerts.

```text
Notify me when:
- Coffee goes below 50 SEK
- Butter enters lowest 10% historical percentile
- Any favorite-store item has Deal Score above 85
- My weekly basket drops below 750 SEK
- Baby Index drops 5% week-over-week
- Dairy Index reaches 3-month low
```

#### 8. Simple mode and advanced mode

The app must not overwhelm normal users.

Simple mode:

```text
Buy now
Wait
Compare
Stock up
Not a real deal
```

Advanced mode:

```text
Charts
Percentiles
Indices
Screener
Volatility
Momentum
Price distribution
```


---

## 5. Competitor and Inspiration Landscape

GroceryView should learn from multiple product categories, not only grocery price apps.

### 4.1 Grocery price comparison apps

Examples:

- Matpriskollen, Sweden
- Matspar, Sweden
- Trolley, UK
- Basket, US
- Frugl, Australia

Common strengths:

- Product price comparison
- Weekly offers
- Shopping lists
- Some basket comparison
- Some price alerts

Common gaps:

- Limited decision intelligence
- Limited true discount validation
- Limited personal budget planning
- Weak private label handling
- Weak receipt analytics
- Weak grocery price indices
- Weak daily workflow integration

### 4.2 Weekly ad and flyer apps

Examples:

- Flipp, US / Canada
- KaufDA, Germany
- Tokubai, Japan

Common strengths:

- Weekly supermarket flyers
- Local offers
- Shopping lists
- Favorite stores
- Deal browsing

Common gaps:

- They often show offers without proving whether the offer is historically good.
- Flyer data is not always converted into structured price intelligence.
- Little or no personal grocery budget intelligence.

### 4.3 Price history and price tracking apps

Examples:

- Keepa
- PriceSpy / Prisjakt
- PriceRunner

Common strengths:

- Price history charts
- Price alerts
- Buy or wait decisions
- Historical highs and lows

Common gaps:

- Usually focused on electronics or e-commerce, not local grocery stores.
- Does not solve weekly supermarket shopping.

### 4.4 Nutrition and barcode apps

Examples:

- Yuka
- Open Food Facts apps

Common strengths:

- Barcode scanning
- Nutrition scores
- Ingredient transparency
- Healthier alternatives

Common gaps:

- Usually weak on price, local store availability, and grocery budgeting.

### 4.5 Shopping list and household planning apps

Examples:

- Bring!
- AnyList

Common strengths:

- Shared lists
- Household collaboration
- Recipes
- Simple repeated usage

Common gaps:

- No advanced price intelligence
- No deal scoring
- No budget-aware optimization

### 4.6 Surplus food and expiry discount apps

Examples:

- Too Good To Go
- Flashfood
- Olio

Common strengths:

- Surplus food discovery
- Reduced food prices
- Sustainability angle

Common gaps:

- They are not full grocery shopping assistants.
- Usually do not track full supermarket pricing and weekly basket needs.

---

## 5. Main Differentiation

Competitors help users find discounts. GroceryView helps users make better grocery decisions.

Key differences:

1. **True Deal Score**  
   The app checks whether a supermarket discount is actually good based on price history, local percentile, unit price, and confidence.

2. **Product Price Terminal**  
   Every product has a page similar to a stock ticker: current price, history chart, percentile, 52-week low/high, deal score, and store comparison.

3. **Favorite Supermarkets + Weekly Basket**  
   Users can save favorite stores, build a weekly list, and plan around budget and offers.

4. **Budget-first Grocery Planning**  
   Users can set weekly and monthly budgets, see estimated basket totals, scan receipts, and review overspending.

5. **Private Label Intelligence**  
   The app distinguishes exact matches, equivalent products, and smart substitutions with confidence levels.

6. **Personal Grocery Inflation**  
   Users can understand how their regular groceries changed in price over time.

7. **Grocery Indices**  
   Stockholm Grocery Index, Coffee Index, Dairy Index, Baby Index, Budget Basket Index, and more.

8. **Community Verification**  
   Receipts, shelf photos, and user confirmations improve data quality.

---

## 6. Target Users

### 6.1 Budget-conscious households

Needs:

- Weekly grocery budget
- Family basket planning
- Favorite supermarkets
- Private label alternatives
- Receipt review

### 6.2 Students

Needs:

- Cheap meals
- Cheapest protein per krona
- Cheapest calories per krona
- Weekly budget limit
- Deal alerts

### 6.3 Deal hunters

Needs:

- 52-week lows
- Watchlist alerts
- Historical price charts
- Stock-up recommendations
- True deal validation

### 6.4 Busy professionals

Needs:

- Favorite store feed
- Fast weekly list
- Simple buy/wait recommendations
- Budget overview
- Receipt scan

### 6.5 Health-conscious users

Needs:

- Nutrition per krona
- Healthier substitutions
- High protein / low sugar / high fiber filters
- Organic and dietary filters

### 6.6 Families with babies

Needs:

- Diaper and baby product tracking
- Household shared lists
- Monthly budget tracking
- Brand-locked preferences for sensitive categories

---

## 7. Platform Strategy

## 7.1 Website

The website should be used for:

- Product discovery
- Price history charts
- Grocery indices
- Public SEO pages
- Store comparison pages
- Category pages
- Basket planning
- Weekly market reports
- B2B demo pages

Example website pages:

```text
/
/market
/deals
/products/[product-slug]
/stores/[store-slug]
/categories/[category-slug]
/indices/stockholm-grocery-index
/basket-planner
/weekly-report
/blog
```

## 7.2 Android and iOS apps

The mobile apps should focus on daily use:

- Favorite supermarkets
- Nearby deals
- Weekly basket
- Budget tracker
- Watchlist alerts
- Barcode scan
- Receipt scan
- In-store mode
- Household shared list
- Push notifications

Suggested bottom navigation:

```text
Today
Stores
Basket
Scan
Profile
```

Alternative advanced navigation:

```text
Market
My Stores
Watchlist
Basket
Scan
```

---

## 8. Core User Flows

## 8.1 Weekly planning flow

```text
User opens app
→ sees weekly budget status
→ creates or updates Weekly Basket
→ app estimates total cost
→ app suggests best stores and substitutions
→ user saves shopping plan
```

## 8.2 Favorite supermarket flow

```text
User saves Willys Odenplan, Lidl Sveavägen, Coop Fridhemsplan
→ app shows deals from those stores
→ app highlights watchlist matches
→ user adds good deals to Weekly Basket
```

## 8.3 Product check flow

```text
User searches or scans coffee
→ product terminal opens
→ app shows price history, current stores, deal score
→ app says Buy / Wait / Compare
```

## 8.4 Budget control flow

```text
User sets weekly budget: 800 SEK
→ adds items to Weekly Basket
→ app estimates 742 SEK
→ user scans items in store
→ running total updates
→ after receipt scan, app reviews actual spend
```

## 8.5 Receipt review flow

```text
User scans receipt
→ app matches products
→ app compares prices with local median and user history
→ app shows good buys, overspend, and budget status
→ app learns user preferences
```

## 8.6 Household flow

```text
User creates household
→ partner joins
→ both add products to shared Weekly Basket
→ app merges preferences and budget
→ app suggests best shopping plan
```

---

## 9. Feature Specification

# Feature 1: Today Dashboard

## Purpose

The Today Dashboard is the app home screen. It should give users a quick summary of what matters this week.

## Key modules

- Weekly budget status
- Best deals from favorite stores
- Watchlist alerts
- Weekly Basket status
- Recommended actions
- Recent price drops
- Receipt insights

## Example screen content

```text
Today

Weekly budget:
642 / 800 SEK used

Weekly Basket:
12 items
Estimated total: 738 SEK
Potential saving: 126 SEK

Best nearby / favorite store deals:
- Coffee at Willys: 49.90 SEK, Deal Score 94
- Chicken thighs at Lidl: 69.90 SEK/kg, Deal Score 88

Watchlist alerts:
2 items below target price

Recommendation:
Buy coffee this week. Wait on butter.
```

## MVP requirements

- Show weekly budget summary
- Show saved stores
- Show top deals
- Show watchlist alerts
- Link to Weekly Basket

---

# Feature 2: Favorite Stores / My Stores

## Purpose

Users should be able to save supermarkets they care about.

## Store types

Users can label stores as:

- Home store
- Work store
- Big shopping store
- Favorite store
- Occasional deal store

## Store profile data

Each store should display:

- Store name
- Chain
- Address
- Opening hours
- Favorite status
- Deal Score today
- Price level vs city average
- Best categories this week
- Number of current offers
- Last updated time
- Confidence level

## Example

```text
Willys Odenplan
Deal Score Today: 82 / 100
Price Level: 12% below Stockholm average
Best Categories: coffee, chicken, frozen food
Watchlist Matches: 4
Last Updated: 42 min ago
```

## Filters

Users can filter by:

- Favorite stores only
- Chain
- District
- Category
- Watchlist matches
- Member-only deals hidden or shown
- Private label hidden or shown
- Verified prices only

---

# Feature 3: Favorite Products / Watchlist

## Purpose

Users can track products or categories they buy often.

## Watchlist item settings

Each item can have:

- Product or category
- Target price
- Preferred brands
- Accept private label: yes / no / maybe
- Organic only: yes / no
- Alert threshold
- Favorite stores only: yes / no
- Stock-up allowed: yes / no

## Alert types

- Target price reached
- New 52-week low
- Historical lowest 10%
- Favorite store offer
- Deal Score above threshold
- Basket total drop
- Stock-up opportunity

## Example

```text
Coffee
Target price: under 50 SEK
Brands: Zoégas, Löfbergs
Private label: maybe
Alert when: Deal Score 80+
```

---

# Feature 4: Weekly Basket

## Purpose

The Weekly Basket is a central feature. It turns the app into a weekly grocery planning tool.

## Creation methods

1. Manual item entry
2. Add from product page
3. Add from deal feed
4. Add from previous week
5. Auto-generate from receipt history
6. Auto-generate from meal plan
7. Household members add items

## Weekly Basket page should show

- Items
- Quantity
- Preferred brand or flexible
- Estimated total
- Budget remaining
- Best store options
- Private label savings
- Buy / wait recommendation
- Stock-up recommendation
- Missing prices

## Example

```text
Weekly Basket

Budget: 800 SEK
Estimated total: 742 SEK
Remaining: 58 SEK

Best option:
Willys + Lidl
Estimated saving vs nearest full basket: 126 SEK

Items:
- Coffee: Buy now, 52-week low
- Butter: Wait, not a real deal
- Chicken: Buy at Willys
- Pasta: Switch to private label
- Bananas: Any favorite store is OK
```

## MVP requirements

- Create list
- Add/remove items
- Mark bought
- Estimate total
- Compare across saved/favorite stores
- Show budget remaining
- Support basic substitutions

---

# Feature 5: Budget Tracker

## Purpose

Users need to plan and control grocery spending.

## Budget levels

- Weekly budget
- Monthly budget
- Category budget
- Household budget

## Before shopping

Show estimated basket cost.

```text
Weekly budget: 800 SEK
Estimated basket: 742 SEK
Remaining: 58 SEK
```

## During shopping

In-store mode should show running total.

```text
Running total: 436 / 800 SEK
Remaining: 364 SEK
```

## After shopping

Receipt scan should compare actual spend to budget.

```text
Trip total: 812 SEK
Budget: 800 SEK
Over budget: 12 SEK

Good buys:
- Chicken: saved 28 SEK
- Coffee: saved 21 SEK

Overspend:
- Cheese: +18 SEK
- Snacks: +24 SEK
```

## Budget modes

- Strict Budget
- Balanced
- Convenience First
- Student Budget
- Family Budget
- Healthy Budget

## MVP requirements

- Weekly budget setting
- Monthly budget setting
- Basket estimate
- Running total
- Receipt total
- Over/under budget summary

---

# Feature 6: Product Price Terminal

## Purpose

Every product should have a rich page similar to a financial asset page.

## Product page sections

- Overview
- Price chart
- Store prices
- Equivalent products
- Smart swaps
- Nutrition per krona
- Price history
- Community verification

## Core metrics

- Current best price
- Current median price
- Stockholm current percentile
- Historical percentile
- 7-day change
- 30-day change
- 90-day change
- 52-week low/high
- Unit price
- Deal Score
- Last verified time
- Source confidence

## Example

```text
ARLA-MILK-1L

Best price: 14.90 SEK
Stockholm percentile: 18th
Historical percentile: 12th
7D: -4.2%
30D: +1.8%
52W range: 11.90 – 19.90 SEK
Deal Score: 84
Verdict: Buy if already visiting this store
```

## MVP requirements

- Product detail page
- Current prices by store
- Basic price chart
- Deal Score
- Unit price
- Watchlist button

---

# Feature 7: True Deal Score

## Purpose

Users need to know whether a promotion is actually good.

## Suggested formula v1

```text
Deal Score =
35% historical percentile
+ 25% current city percentile
+ 20% unit price vs equivalent products
+ 10% discount depth
+ 5% source confidence
+ 5% user relevance
```

For MVP, if historical data is limited:

```text
Deal Score v1 =
40% current city percentile
+ 25% known promo history
+ 20% unit price vs equivalent products
+ 10% discount depth
+ 5% source confidence
```

## Score bands

```text
90–100: Excellent deal
75–89: Good deal
60–74: Fair deal
40–59: Normal price
0–39: Not a real deal
```

## Display format

```text
Deal Score 92
Verdict: Buy now

Why:
- Lowest 8% of observed prices
- 18% below Stockholm median
- Verified in 3 sources
- Not member-only
```

## Important rule

Ads and sponsored placements must never change Deal Score.

---

# Feature 8: Basket Comparison Engine

## Purpose

Users do not always buy from one supermarket. The app should compare basket strategies across selected stores.

## Important rule

Do not optimize or penalize by travel time. The user chooses how far they are willing to go.

## Strategy types

- Buy all from one store
- Buy from favorite stores only
- Buy from selected chains
- Buy cheapest by product
- Buy cheapest by category
- Buy with private label substitutions
- Buy with brand-locked items respected

## Example output

```text
Basket Strategy

Option A: All at Willys
Total: 742 SEK

Option B: All at Lidl
Total: 719 SEK

Option C: Cheapest across favorite stores
Total: 672 SEK

Option D: With private label substitutions
Total: 621 SEK

Savings breakdown:
- Store choice: 74 SEK
- Current deals: 31 SEK
- Private label substitution: 68 SEK
```

## User settings

- Max stores: 1 / 2 / 3 / unlimited
- Favorite stores only: yes / no
- Include private label: yes / no / depends
- Include member prices: yes / no
- Include online prices: yes / no
- Include in-store verified prices: yes / no

---

# Feature 9: Private Label and Substitution Engine

## Purpose

Supermarkets have private label products. The app must handle them carefully and transparently.

## Comparison modes

### 1. Exact Match

Same product, brand, size, and barcode where possible.

Example:

```text
Barilla Spaghetti 500g
```

### 2. Equivalent Match

Same functional category and similar size.

Example:

```text
All spaghetti 500g products
```

### 3. Smart Swap

Recommended substitution based on savings and confidence.

Example:

```text
Barilla Spaghetti → Garant Spaghetti
Save: 25%
Substitution confidence: High
Quality risk: Low
```

## Brand preference options

- Only exact product
- Same brand tier
- Accept standard private label
- Accept budget private label
- Organic only
- No substitution for this category

## Brand tiers

- National brand
- Premium brand
- Standard private label
- Budget private label
- Organic private label
- Discount chain label

## Substitution confidence by category

```text
High: pasta, rice, sugar, flour, milk
Medium: coffee, butter spread, yogurt, toilet paper
Medium-low: cheese, bread, olive oil
Low: meat, fish, fruit, vegetables
Do not auto-substitute: baby formula, medical diet items, pet food where brand matters
```

---

# Feature 10: Barcode Scan

## Purpose

Users should be able to scan products in store.

## Scan result should show

- Product name
- Current store price if known
- Other store prices
- Historical price chart
- Deal Score
- Unit price
- Equivalent products
- Smart swaps
- Nutrition per krona
- Add to Weekly Basket
- Add to Watchlist

## Example

```text
Zoégas Coffee 450g

This store: 64.90 SEK
Best known price: 49.90 SEK
Historical percentile: 61st
Deal Score: 42
Verdict: Not a real deal. Wait or buy elsewhere.
```

---

# Feature 11: Receipt Scan

## Purpose

Receipt scanning improves user value and backfills real transaction data.

## Receipt scan should extract

- Store
- Date/time
- Total amount
- Item names
- Quantities
- Item totals
- Discounts
- Member prices if visible

## Receipt review output

```text
Trip Summary

Total: 642 SEK
Budget: 800 SEK
Under budget: 158 SEK

Compared with local median: +38 SEK
Could have saved: 84 SEK

Good buys:
- Chicken thighs: Deal Score 91
- Bananas: 14% below local median

Overspend:
- Coffee: +22 SEK
- Cheese: +18 SEK
```

## Data confidence

Receipt data should be treated as medium-high confidence but not perfect, because OCR and product matching can fail.

---

# Feature 12: Personal Grocery Inflation

## Purpose

Users should understand how their own grocery costs change over time.

## Inputs

- Weekly Basket history
- Receipt scans
- Watchlist items
- Favorite categories

## Metrics

- Same basket vs last month
- Same basket vs 3 months ago
- Personal grocery inflation
- Category drivers
- Brand vs private label effect
- Avoidable overspend

## Example

```text
Your Grocery Inflation

This month: +5.8%
Stockholm average basket: +3.9%

Biggest drivers:
- Coffee +14%
- Dairy +8%
- Baby products +6%
```

---

# Feature 13: Grocery Price Indices and Percentile System

## Purpose

This is the most important TradingView-style feature.

GroceryView should not only track individual product prices. It should create structured price indices that allow users to understand grocery inflation, category movement, supermarket competitiveness, and local price levels.

The system should support indices by:

```text
Food category
Supermarket chain
Individual store
District / area
All Stockholm
User-selected favorite stores
Brand tier
Basket type
User household basket
```

This lets GroceryView answer questions such as:

```text
Is dairy getting more expensive across Stockholm?
Is Willys cheaper than Coop for protein this week?
Which supermarket has the cheapest baby-products basket?
Is my favorite ICA expensive compared with other ICA stores?
Is coffee at a 3-month low?
Is this product in the lowest 10% of its historical prices?
```

---

## 13.1 Index dimensions

### A. City-level indices

These show the overall market.

```text
Stockholm Grocery Index
Stockholm Dairy Index
Stockholm Coffee Index
Stockholm Protein Index
Stockholm Baby Index
Stockholm Cleaning Index
Stockholm Private Label Index
Stockholm Organic Index
```

Example:

```text
Stockholm Coffee Index: 91.6
1W: -6.2%
1M: -8.4%
YTD: +3.1%
Current level: 12th historical percentile
Verdict: Coffee is cheap relative to recent history
```

---

### B. District / area indices

Users should be able to compare local areas.

Examples:

```text
Odenplan Grocery Index
Södermalm Budget Basket Index
Kungsholmen Dairy Index
Kista Student Basket Index
Solna Baby Index
```

Use cases:

```text
Which area is cheapest for my basket?
Is my home area expensive?
Are baby products cheaper near work or near home?
```

---

### C. Chain-level indices

Each chain should have category and basket indices.

Examples:

```text
Willys Stockholm Grocery Index
ICA Stockholm Grocery Index
Coop Stockholm Grocery Index
Lidl Stockholm Grocery Index
Hemköp Stockholm Grocery Index
City Gross Stockholm Grocery Index
```

Category examples:

```text
Willys Dairy Index
Lidl Coffee Index
Coop Organic Index
ICA Baby Index
Hemköp Cleaning Index
```

Use cases:

```text
Which chain is cheapest for dairy this week?
Which chain has the strongest coffee promotions?
Which chain is becoming more expensive fastest?
```

---

### D. Store-level indices

Individual stores should have their own price-level profile.

Examples:

```text
Willys Odenplan Grocery Index
ICA Nära Odenplan Price Level
Coop Fridhemsplan Dairy Index
Lidl Sveavägen Budget Basket Index
```

Store profile metrics:

```text
Overall price level vs Stockholm
Overall price level vs same chain
Best categories
Worst categories
Deal density
Watchlist match count
Favorite-store percentile
```

Example:

```text
Willys Odenplan
Overall price level: 14% below Stockholm median
Within Willys stores: 42nd percentile
Best categories: Coffee, Frozen, Cleaning
Worst categories: Fresh vegetables
Deal density this week: High
```

---

### E. Favorite-store indices

Users should be able to create a personal mini-market based on the stores they actually care about.

Example:

```text
My Stores Grocery Index
My Stores Coffee Index
My Stores Baby Index
My Weekly Basket Index
```

This is important because many users do not care about every supermarket in Stockholm. They care about:

```text
Stores near home
Stores near work
Stores they trust
Stores they are willing to visit for lower prices
Stores with good private label options
```

---

### F. Basket-type indices

These represent different lifestyles and shopping needs.

```text
Student Basket Index
Family Basket Index
Budget Basket Index
Premium Basket Index
Vegan Basket Index
High Protein Basket Index
Baby Basket Index
Cleaning Basket Index
Pantry Staples Index
Breakfast Basket Index
```

Example:

```text
Student Basket Index
1W: -1.8%
1M: +2.4%
Cheapest chain: Lidl
Cheapest area: Kista
Biggest driver: Coffee -7.2%
```

---

### G. Brand-tier indices

Private label is a major part of grocery pricing, so indices must separate brand tiers.

```text
Private Label Index
Budget Private Label Index
Standard Private Label Index
Premium Brand Index
Organic Brand Index
National Brand Index
```

Use cases:

```text
Are private labels still cheaper?
Is the gap between branded and private label widening?
Which categories have the best private-label savings?
```

Example:

```text
Brand Premium Gap
National brands are 31% more expensive than private label equivalents this week.
Highest gap: Pasta, Coffee, Cleaning
Lowest gap: Milk, Eggs
```

---

## 13.2 Percentile system

Percentiles are one of the most important product differentiators. They convert raw prices into understandable signals.

### A. Current Stockholm percentile

Shows where a product's current price sits across Stockholm stores today.

```text
Coffee 450g at 49.90 SEK
Current Stockholm percentile: 8th
Meaning: cheaper than 92% of observed Stockholm store prices today
```

---

### B. Historical percentile

Shows where today's price sits compared with the product's own historical price range.

```text
Coffee 450g at 49.90 SEK
Historical percentile: 6th
Meaning: this is among the cheapest 6% of observed prices for this product
```

---

### C. Category unit-price percentile

Shows whether a product is cheap compared with equivalent products in the same category.

```text
Spaghetti 500g
Unit price: 21.80 SEK/kg
Category percentile: 14th
Meaning: cheap compared with equivalent spaghetti products
```

---

### D. Store price-level percentile

Shows how expensive a store is relative to other stores.

```text
ICA Nära Odenplan
Grocery price-level percentile: 72nd
Meaning: more expensive than most Stockholm stores in the tracked basket
```

---

### E. Favorite-store percentile

Shows whether a deal is good only within the user's selected stores.

```text
Butter 600g
All Stockholm percentile: 35th
My Stores percentile: 5th
Meaning: not the cheapest in Stockholm, but very good among stores I actually visit
```

---

### F. Basket percentile

Shows whether a full weekly basket is cheap compared with other possible baskets.

```text
This Weekly Basket
Total: 742 SEK
Stockholm basket percentile: 18th
My Stores basket percentile: 9th
Meaning: this is a strong basket price within the user's selected supermarkets
```

---

## 13.3 Index methodology

For MVP, keep the methodology simple and transparent.

### Base index

```text
Index value = 100 on the chosen base date
Current index = weighted basket price today / weighted basket price on base date * 100
```

### Weighting

Possible weighting methods:

```text
Equal weight per canonical product
Household basket weight
Category weight
User-personalized weight from receipts
Volume-weighted later if partner data is available
```

MVP recommendation:

```text
Use fixed basket methodology with equal weights inside each category.
Clearly show which products are included.
```

### Price normalization

All index calculations must use comparable unit prices where relevant:

```text
SEK / kg
SEK / liter
SEK / piece
SEK / roll
SEK / wash
SEK / diaper
```

### Outlier handling

```text
Remove obvious data errors
Separate member-only prices from regular prices
Separate online prices from verified in-store prices
Apply source-confidence weighting
Do not mix exact products and equivalents without labelling
```

### Confidence labels

Every index should show a confidence level:

```text
High confidence: enough verified products and stores
Medium confidence: partial coverage
Low confidence: early / estimated / promo-heavy data
```

---

## 13.4 Index UI requirements

Each index page should include:

```text
Current index value
1W / 1M / 3M / YTD movement
Historical percentile
52-week high / low
Top contributors
Biggest price drops
Biggest price increases
Cheapest chain
Most expensive chain
Cheapest area
Favorite-store comparison
Data confidence
Included products list
```

Example page:

```text
Stockholm Dairy Index
Current: 108.4
1W: +0.8%
1M: +3.2%
YTD: +6.9%
Historical percentile: 74th
52W range: 96.2 - 112.9

Cheapest chain: Lidl
Most expensive chain: ICA Nära
Top driver: Butter +8.4%
Best deal now: Arla Milk 1L at Willys
Confidence: Medium-high
```

---

## 13.5 TradingView-style index watchlist

Users can add indices to their watchlist.

Examples:

```text
Stockholm Grocery Index
My Stores Basket Index
Coffee Index
Baby Index
Private Label Index
Willys Dairy Index
ICA Odenplan Price Level
```

Alerts:

```text
Notify me when Coffee Index drops below 90
Notify me when Baby Index falls 5% in a week
Notify me when my Weekly Basket drops below 700 SEK
Notify me when Private Label Gap exceeds 30%
```

---

## 13.6 MVP indices

MVP should not attempt every possible index. Start with a small set that demonstrates the TradingView concept clearly.

### MVP required

```text
Stockholm Grocery Index
Stockholm Coffee Index
Stockholm Dairy Index
Stockholm Protein Index
Budget Basket Index
My Stores Basket Index
Private Label Index
```

### MVP optional

```text
Baby Index
Cleaning Index
Student Basket Index
Family Basket Index
Selected district index
```

### Later

```text
Store-level indices
District-level heatmaps
Personal CPI index
Country expansion indices
B2B category indices
```

---

# Feature 14: Nutrition per Krona

## Purpose

Combine price and nutrition value.

## Metrics

- Protein per 10 SEK
- Calories per 10 SEK
- Fiber per 10 SEK
- Sugar per 100g
- Salt warning
- Organic premium
- Healthier alternatives

## Example

```text
Best protein deals

1. Chicken thighs — 23g protein / 10 SEK
2. Eggs 12-pack — 19g protein / 10 SEK
3. Greek yogurt — 16g protein / 10 SEK
4. Tofu — 15g protein / 10 SEK
```

---

# Feature 15: Deal-based Meal Planning

## Purpose

Generate meal ideas based on what is cheap this week.

## Modes

- Weekly meals under budget
- High protein meals
- Family dinner under target cost
- Vegetarian budget meals
- Use what is on sale
- Use pantry items

## Example

```text
This week near your favorite stores:
- Chicken thighs -28%
- Pasta -20%
- Tomatoes -15%

Suggested meals:
1. Chicken tomato pasta
2. Chicken rice bowl
3. Tomato soup + bread

Estimated cost: 43 SEK / meal
```

---

# Feature 16: Household Mode

## Purpose

Many grocery purchases are shared by households.

## Features

- Shared Weekly Basket
- Shared Watchlist
- Shared budget
- Who added what
- Mark as bought
- Pantry inventory
- Household preferences
- Shared favorite stores

## Example

```text
Household Basket

Billy added:
- Milk
- Eggs
- Coffee

Partner added:
- Diapers
- Bananas

Recommendation:
Your basket is 86 SEK cheaper if using Willys + Lidl compared with your nearest ICA.
```

---

# Feature 17: Yellow Sticker / Expiry Deal Radar

## Purpose

Many strong grocery deals are not in online flyers. They are in-store expiry markdowns.

## Features

- User-submitted shelf photos
- Reduced food section by store
- Expiry deal alerts
- Verification by other users
- Filter by category

## Example

```text
Reduced food near you

Hemköp Fridhemsplan
- Chicken breast -50%, expires today
- Salad boxes -30%
Verified 18 min ago

Coop Odenplan
- Bakery -40% after 19:00
```

---

# Feature 18: Community Verification

## Purpose

Data quality can improve through user contributions.

## User contributions

- Receipt upload
- Shelf price photo
- Wrong price report
- Out of stock report
- Product match correction
- Store offer confirmation

## Contributor reputation

Users can earn trust points for accurate submissions.

## Example

```text
Coffee 49.90 SEK
Verified by:
- retailer online
- 2 receipts
- 1 shelf photo
Last verified: 34 min ago
Confidence: High
```

---

## 10. Monetization Strategy

## 10.1 Free with ads

Free users can access:

- Favorite stores
- Basic product search
- Nearby / favorite store deals
- Basic Weekly Basket
- Basic budget tracker
- Limited watchlist
- Limited price history
- Limited alerts

Ad channels:

- Google AdMob for Android and iOS apps
- Google AdSense for website
- Clearly labelled native sponsored placements

## 10.2 Premium subscription

Potential price:

```text
29–59 SEK / month
```

Premium features:

- No ads
- Unlimited favorite stores
- Unlimited watchlist items
- Unlimited alerts
- Advanced price history
- Advanced Weekly Basket optimization
- Receipt scan analytics
- Personal grocery inflation
- Household sharing
- Pantry tracking
- Meal planning
- Advanced private label smart swaps

## 10.3 B2B analytics

Future product:

- Category price trends
- Brand vs private label analytics
- Promotion frequency
- Regional price differences
- Grocery indices
- API access

## 10.4 Affiliate / referral

Optional future revenue:

- Online grocery referral links
- Delivery provider partnerships
- Cashback partnerships

## 10.5 Sponsored offers

Sponsored offers may exist, but must be clearly labelled and separated from organic ranking.

---

## 11. Advertising Principles

Because trust is central, ads must not pollute recommendations.

Rules:

1. Ads never affect Deal Score.
2. Ads never affect Best Price ranking.
3. Sponsored placements must be labelled as sponsored.
4. Users must be able to distinguish organic deal recommendations from ads.
5. Premium users can remove ads.
6. Receipt data and private budget data should not be exposed to advertisers.
7. The app should not recommend worse deals because they are sponsored.

Recommended ad placements:

- Market feed native ad
- Product page bottom banner
- Weekly report inline ad
- Website article display ads
- Free-tier receipt summary bottom placement

Avoid ads in:

- Barcode scan result top area
- Budget warning area
- Deal Score explanation
- Checkout-style decision screen
- Critical in-store flow

---

## 12. Data Strategy

## 12.1 Product data

Sources:

- Retailer catalogs
- Open product databases such as Open Food Facts
- Barcode scans
- Receipt scans
- User corrections
- Manual seed data

## 12.2 Price observations

Every observed price should be stored as an event, not overwritten.

```sql
price_observations
- id
- product_id
- retailer_product_id
- store_id
- chain_id
- observed_at
- price
- unit_price
- currency
- regular_price
- promo_price
- member_price
- promo_type
- source_type
- source_url
- confidence_score
- is_online_price
- is_instore_price
```

## 12.3 Promotion observations

```sql
promotion_observations
- id
- product_id
- chain_id
- store_id
- promo_start
- promo_end
- promo_price
- regular_price_claimed
- promo_text
- member_only
- multi_buy_quantity
- multi_buy_price
- source_type
- confidence_score
```

## 12.4 Product catalog

```sql
products
- id
- barcode
- canonical_name
- brand
- brand_owner
- private_label_owner
- category_id
- subcategory_id
- package_size
- package_unit
- comparable_unit
- organic
- lactose_free
- gluten_free
- vegan
- image_url
- nutrition_source
- created_at
```

## 12.5 Product aliases

Needed for receipt matching and retailer product matching.

```sql
product_aliases
- id
- raw_name
- source_type
- matched_product_id
- match_confidence
- reviewed_by_human
```

## 12.6 Store table

```sql
stores
- id
- chain_id
- name
- address
- city
- district
- latitude
- longitude
- store_type
- opening_hours
- online_store_id
```

## 12.7 User preferences

```sql
user_preferences
- user_id
- weekly_budget
- monthly_budget
- accept_private_label
- accept_budget_private_label
- include_member_prices
- preferred_language
- preferred_currency
```

---

## 13. Data Confidence System

Every price should show trust metadata.

Source confidence example:

```text
Official API: 0.95
Retailer online page: 0.85
Receipt scan: 0.80
Shelf photo: 0.75
Flyer / campaign: 0.70
Manual user report: 0.50
Estimated: 0.25
```

UI labels:

- Verified price
- Recently observed
- Receipt verified
- Shelf photo verified
- Promo-only history
- Estimated price
- Last updated

Important chart rule:

```text
Solid line = verified observed price
Dotted line = estimated or promo-only history
```

---

## 14. MVP Scope

## 14.1 MVP goal

Launch a useful Stockholm-focused app and website that proves users want grocery price intelligence beyond simple price comparison.

## 14.2 MVP platforms

- Responsive website
- Android app
- iOS app

Cross-platform implementation can be React Native / Expo for mobile and Next.js for web, unless the development team chooses another stack.

## 14.3 MVP core features

P0:

1. User account
2. Favorite stores
3. Favorite products / watchlist
4. Weekly Basket
5. Weekly budget tracker
6. Product search
7. Product price page
8. Current store prices
9. Basic price history chart
10. Deal Score v1
11. Store deal feed
12. Basket comparison across selected stores
13. Exact vs equivalent product display
14. Basic private label preference
15. Basic alerts
16. Ad-ready layout for free tier
17. Website pages for market, product, store, category

P1:

1. Barcode scan
2. Receipt scan
3. Personal grocery inflation
4. Household sharing
5. Advanced private label smart swaps
6. Nutrition per krona
7. Meal planning from deals
8. Community verification

P2:

1. Yellow sticker radar
2. Pantry management
3. Advanced grocery indices
4. B2B dashboard
5. API access
6. Multi-city expansion

---

## 15. MVP Product Categories

Start with high-frequency products.

Initial categories:

- Dairy
- Eggs
- Coffee
- Meat
- Pantry
- Bread
- Fruit and vegetables
- Frozen
- Baby
- Cleaning
- Household paper

Initial hero products:

```text
milk
eggs
butter
coffee
chicken
minced beef
pasta
rice
bread
cheese
bananas
tomatoes
potatoes
toilet paper
detergent
diapers
oat milk
yogurt
olive oil
frozen pizza
```

---

## 16. Suggested Technical Architecture

## 16.1 Frontend

Website:

- Next.js
- TypeScript
- Tailwind CSS
- Chart library for price charts
- SEO-friendly pages

Mobile:

- React Native / Expo
- TypeScript
- Shared API client
- Push notifications
- Barcode scanner
- Camera receipt upload

## 16.2 Backend

Options:

- Node.js / NestJS
- Python FastAPI
- PostgreSQL
- Redis for caching
- Background jobs for ingestion
- Object storage for receipts and shelf photos

## 16.3 Data pipeline

Modules:

- Product ingestion
- Price ingestion
- Promotion ingestion
- Receipt OCR ingestion
- Product matching
- Deal Score calculation
- Index calculation
- Alert engine

## 16.4 Analytics

Track:

- Product searches
- Watchlist additions
- Weekly Basket creation
- Budget usage
- Receipt scans
- Alert clicks
- Deal clicks
- Favorite store additions
- Ad impressions
- Premium conversions

---

## 17. Suggested API Endpoints

```text
GET /api/market/overview
GET /api/stores
GET /api/stores/:id
POST /api/users/:id/favorite-stores
DELETE /api/users/:id/favorite-stores/:storeId

GET /api/products/search?q=
GET /api/products/:id
GET /api/products/:id/prices
GET /api/products/:id/history
GET /api/products/:id/equivalents
GET /api/products/:id/deal-score

GET /api/watchlist
POST /api/watchlist
PATCH /api/watchlist/:id
DELETE /api/watchlist/:id

GET /api/basket/current
POST /api/basket/items
PATCH /api/basket/items/:id
DELETE /api/basket/items/:id
POST /api/basket/compare

GET /api/budget
PATCH /api/budget
GET /api/budget/summary

POST /api/scan/barcode
POST /api/scan/receipt
POST /api/community/price-report

GET /api/indices
GET /api/indices/:id
```

---

## 18. User Settings

Essential settings:

- Home area
- Work area
- Favorite stores
- Preferred chains
- Weekly budget
- Monthly budget
- Accept private label
- Accept budget private label
- Include member prices
- Preferred language
- Notification preferences
- Dietary preferences
- Household members

Notification settings:

- Target price alerts
- Favorite store deals
- Watchlist alerts
- Budget alerts
- Weekly report
- Receipt summary
- Stock-up opportunities

---

## 19. Privacy and Trust

The app handles sensitive data:

- Location
- Shopping habits
- Receipts
- Household budget
- Dietary preferences

Privacy principles:

1. Users can delete receipt history.
2. Users can delete account data.
3. Receipt images should not be used for ads.
4. Personal shopping data should not be sold to advertisers.
5. Aggregated analytics can be used only after anonymization.
6. Sponsored offers must be clearly labelled.
7. Location should be used for store relevance and not exposed unnecessarily.
8. Premium users should have an ad-free option.

---

## 20. International Expansion Design

The product should not hardcode Sweden-specific assumptions.

The data model should support:

- Country
- City
- Currency
- Language
- Retailer chain
- Store-level pricing
- Tax / VAT differences
- Bottle deposit / pant
- Loyalty pricing
- Member pricing
- Online vs in-store pricing
- Private label owner
- Brand tier
- Unit conversion
- Local product taxonomy

Expansion template:

1. Launch city
2. Seed hero product catalog
3. Add top chains
4. Add current price tracking
5. Add local weekly deals
6. Build city grocery index
7. Launch SEO pages
8. Add receipt/community verification
9. Expand city-by-city

Possible future markets:

- Gothenburg
- Malmö
- Oslo
- Copenhagen
- Helsinki
- London
- Berlin
- Amsterdam
- Sydney

---

## 21. Roadmap

## Phase 1: 0–3 months — Stockholm MVP

- Build product catalog for 500 products
- Build store database
- Build web dashboard
- Build mobile MVP
- Favorite stores
- Weekly Basket
- Budget tracker
- Product search
- Product page
- Price observations
- Deal Score v1
- Watchlist
- Basic basket comparison

## Phase 2: 3–6 months — Daily utility

- Barcode scan
- Receipt scan
- Household sharing
- Personal grocery inflation
- Private label smart swaps
- Basic meal planning
- Better alerts
- More stores and products

## Phase 3: 6–12 months — Data moat

- Community verification
- Yellow sticker radar
- Advanced grocery indices
- SEO price pages
- Newsletter
- Pantry tracking
- B2B analytics beta

## Phase 4: 12+ months — Expansion

- Gothenburg and Malmö
- Nordic expansion
- Paid data partnerships
- Retailer partnerships
- B2B dashboard
- API access
- International city template

---

## 22. Success Metrics

## User metrics

- Weekly active users
- Monthly active users
- Favorite stores per user
- Watchlist items per user
- Weekly Baskets created
- Budget trackers enabled
- Basket comparisons run
- Barcode scans
- Receipt scans
- Alerts clicked
- 4-week retention

## Data metrics

- Products tracked
- Stores tracked
- Daily price observations
- Promotion observations
- Receipt observations
- Shelf photo observations
- Product match accuracy
- Price confidence score
- Coverage by category

## Business metrics

- Ad impressions
- Ad revenue per user
- Premium conversion rate
- Average revenue per user
- Website SEO traffic
- Newsletter subscribers
- B2B leads
- Retailer partnership leads

---

## 23. Risks and Mitigations

## Risk 1: Price data access

Problem:

Retailer prices may be difficult to collect or legally sensitive.

Mitigation:

- Start with limited products
- Store raw observations
- Use confidence scores
- Explore partnerships
- Use receipt and community verification
- Avoid overclaiming complete coverage

## Risk 2: Product matching errors

Problem:

Product names, package sizes, private labels, and receipt names are messy.

Mitigation:

- Use canonical product graph
- Separate Exact / Equivalent / Smart Swap
- Show comparison confidence
- Human review low-confidence matches

## Risk 3: User trust

Problem:

Incorrect prices can damage trust.

Mitigation:

- Show last updated time
- Show source type
- Show confidence level
- Allow users to report wrong prices
- Use verified labels

## Risk 4: App becomes too complex

Problem:

TradingView-style features may overwhelm normal users.

Mitigation:

- Simple mode: Buy / Wait / Compare
- Advanced mode: charts, percentiles, indices
- Progressive disclosure

## Risk 5: Ads reduce trust

Problem:

Users may think recommendations are paid.

Mitigation:

- Clear sponsored labels
- Ads never affect ranking
- Premium ad-free plan
- Transparency policy

---

## 24. Claude Code Implementation Notes

When implementing MVP, prioritize practical daily use over advanced analytics.

Build order suggestion:

Before building normal grocery-list features, keep the TradingView-style architecture in mind: products, categories, stores, baskets, and indices should all be treated as trackable instruments with charts, watchlists, percentiles, and alerts.

1. Data models
2. User auth
3. Store database
4. Product catalog
5. Price observation storage
6. Product search API
7. Store pages
8. Product pages
9. Favorite stores
10. Watchlist
11. Weekly Basket
12. Budget tracker
13. Basket comparison
14. Deal Score v1
15. Mobile screens
16. Website pages
17. Alerts
18. Ad placeholders

Do not implement travel-time optimization in MVP.

For the basket engine, compare prices across selected/favorite stores only. Show distance or address as information, but do not penalize far stores.

Core entities to implement first:

- User
- Store
- Chain
- Product
- ProductAlias
- PriceObservation
- PromotionObservation
- FavoriteStore
- WatchlistItem
- WeeklyBasket
- BasketItem
- Budget
- DealScore

---

## 25. Final Product Principle

GroceryView should not simply answer:

```text
Where is this item cheapest?
```

It should answer:

```text
Given my favorite stores, weekly list, budget, brand preferences, price history, and current offers, what is the smartest way to shop this week?
```

This is the core product advantage.
