# GroceryView Competitor Analysis

**Lane:** COMPETITOR-ANALYSIS / Pane 4  
**Date:** 2026-05-16  
**Launch context:** Stockholm, Sweden  
**Proposal reviewed:** `PROPOSAL.md` v0.2, especially the "TradingView for groceries" positioning and Section 5 competitor landscape.

## 1. Executive takeaways

GroceryView should not try to be only "another Swedish grocery price comparison app." Stockholm already has useful fragments of the experience:

- **Matpriskollen** covers Swedish weekly offers and is moving into current price comparison.
- **Matspar, Nätmat/Natmat, Matbit, PRISSPAR, Rezepta, Matmoms, Comparator, Matindex, Kvittovakten** show that Swedish consumers already want item and basket price transparency.
- **ICA, Coop, Willys, Hemköp, Lidl, City Gross** have strong loyalty apps, but each is a closed retailer silo.
- **Mathem, Wolt Market, foodora, Picsmart, Matsmart/Motatos** solve convenience, fast delivery, or surplus purchasing, not neutral price intelligence.
- **Keepa, PriceRunner, Prisjakt/PriceSpy** prove that price history, alerts, and "is this a real deal?" workflows are valuable, but they are mostly e-commerce oriented.
- **Yuka** proves barcode-scan clarity and trusted scoring can change shopping behavior, but it is weak on price and local availability.
- **Bring!** proves shared household grocery workflows have daily utility, but it does not answer what to buy, when, or where.

The open space is a **Stockholm grocery market terminal**: store-level current prices, verified price history, true-deal scoring, favorite-store watchlists, basket planning, budgets, receipt feedback loops, and grocery indices in one workflow.

The highest-value gap is not "price comparison" by itself. It is **decision intelligence**: _Is this price good relative to this product's history, equivalent products, my preferred stores, my budget, and the current Stockholm market?_

---

## 2. Market context for Stockholm

Sweden is a high-fit launch market because grocery prices are politically and financially salient, and grocery retail is concentrated.

- Statistics Sweden reported that food prices rose through 2025, then fell 5.5% in April 2026 after Sweden's temporary food-VAT reduction took effect on 1 April 2026. This creates user demand for month-by-month and product-by-product transparency, not just flyers. Sources: [SCB 2025 food prices](https://www.scb.se/pressmeddelande/matpriserna-steg-under-2025/?menu=open), [SCB April 2026 food-price CPI](https://www.scb.se/pressmeddelande/matpriserna-sjonk-i-april2/), [Skatteverket food VAT 2026](https://www.skatteverket.se/omoss/pressochmedia/nyheter/2026/nyheter/livsmedelsmomsensankstill6procent.5.70685bee19c85dd5dd0a3f.html), [Konsumentverket monitoring assignment](https://www.konsumentverket.se/uppdrag-matmoms/).
- The Swedish Competition Authority describes Swedish grocery retail as concentrated around ICA, Axfood, Coop, and Lidl, with high barriers to entry and limited consumer transparency. Sources: [Konkurrensverket market review](https://www.konkurrensverket.se/informationsmaterial/rapportlista/konkurrensverkets-genomlysning-av-livsmedelsbranschen-20232024/), [Konkurrensverket English summary PDF](https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/rapportserie/rapport_2024-5_summary.pdf).
- Stockholm shoppers face especially high choice complexity: dense neighborhoods, many chain formats, independent stores, member pricing, delivery apps, and online grocery options. This favors a product that lets users choose their own scope rather than optimizing away distance by default, matching the proposal's explicit product decision.

Implication: GroceryView can frame itself as **consumer-side market infrastructure** rather than a coupon app.

---

## 3. Competitor map by job-to-be-done

| Job | Existing solutions | What they do well | What remains open for GroceryView |
|---|---|---|---|
| Find weekly offers | Matpriskollen, Flipp, Dayli, Matpris, Veckans 200, chain apps | Fast local deal discovery | Validate whether deals are historically good; normalize unit prices, member terms, multi-buys, and equivalents |
| Compare a basket | Matspar, Nätmat/Natmat, Matbit, PRISSPAR, Rezepta, Comparator, Matpriskollen | Basket-level price comparison exists | Store-level physical coverage, price history, confidence scoring, favorite-store workflows, and private-label equivalents are still thin |
| Track price history | Keepa, PriceRunner, Prisjakt/PriceSpy, Kvittovakten, Matmoms | Charts, alerts, fake-deal detection in e-commerce or one data source | Grocery-specific history across local supermarkets, promotion markers, member prices, 52-week ranges, and Stockholm percentiles |
| Decide what is healthy | Yuka, Open Food Facts, chain nutrition labels | Barcode scan and clear health scores | Price-per-nutrition, availability, dietary constraints plus local deal context |
| Coordinate a household list | Bring!, AnyList, ICA/Coop/Willys/Hemköp apps | Shared lists and recipes | Budget-aware, price-aware, deal-aware household lists across chains |
| Buy groceries online | Mathem, Wolt Market, foodora, Picsmart, chain e-commerce | Convenience, fulfilment, same-day delivery | Neutral comparison and "should I buy here now?" intelligence |
| Use surplus/expiry deals | Karma, Too Good To Go, Fiffit, Matsmart/Motatos | Cheap surplus and sustainability | Integrate occasional surplus into weekly staples without replacing full grocery planning |
| Reduce home waste / manage pantry | Matdags, generic pantry apps | Expiry reminders, receipt/barcode scanning, recipe suggestions | Connect what is already at home to current prices, replenishment timing, and budget-aware shopping |

---

## 4. Named competitor profiles

### 4.1 Mathem

**Category:** Online grocery retailer / delivery.  
**Relevance to GroceryView:** Major Stockholm grocery option and source of structured product data, delivery behavior, and online purchase history.

**Current positioning and capabilities**

- Mathem offers online grocery shopping through web and app, with delivery across Stockholm and other areas. Its Stockholm page says it covers all of Stockholm and supports home delivery. Source: [Mathem Stockholm delivery](https://www.mathem.se/se/about/hemleverans-stockholm/).
- Mathem says users can shop from more than 12,000 products, use search, categories, recipes, and labels such as temporary offers and low-price items. Source: [Mathem how it works](https://www.mathem.se/se/about/handla-pa-mathem/).
- Mathem is now part of Oda Group after the Mathem/Oda merger; Axfood stated that Swedish operations would continue under the Mathem brand. Source: [Axfood merger announcement](https://www.axfood.com/newsroom/news/mathem-is-merging-with-norwegian-oda/).
- The app includes recipes, filters, barcode scanning, and delivery notifications. Source: [Mathem Google Play listing](https://play.google.com/store/apps/details?id=se.mathem.mathem).

**Strengths**

- Deep SKU catalog with purchasable products.
- Strong fulfilment and delivery promise compared with pure comparison tools.
- App, web, recipes, repeat shopping, and order history create habitual use.
- Mathem/Oda operational system may improve efficiency and reduce spoilage.

**Gaps GroceryView can fill**

- Mathem is a **retailer**, not a neutral decision layer. It does not help the user decide whether the same or equivalent basket is better at Willys, Lidl, ICA, Coop, Hemköp, City Gross, Wolt Market, or physical stores.
- Its labels such as offer/low-price do not inherently prove historical value.
- Delivery convenience can hide unit-price and substitute tradeoffs.
- Mathem order history is rich but siloed; GroceryView can ingest receipts/orders and benchmark them against the wider Stockholm market.

**Strategic implication**

Treat Mathem as both a competitor and a potential data-rich integration target. GroceryView should support "Mathem receipt/order intelligence" without becoming Mathem-only.

---

### 4.2 Flipp

**Category:** Weekly ads, flyers, coupons, shopping list.  
**Relevance:** Inspiration for local offer aggregation and favorite-store deal browsing.

**Current positioning and capabilities**

- Flipp aggregates weekly ads, deals, coupons, shopping lists, watch lists, and item details for local retailers in the US and Canada. Source: [Flipp homepage](https://app.flipp.com/).
- Flipp claims meaningful weekly savings among surveyed users and emphasizes favorite local stores. Source: [Flipp homepage](https://app.flipp.com/).

**Strengths**

- Clear user value: replace paper flyers and retailer-by-retailer browsing.
- Strong local-store orientation.
- Simple shopping-list and watch-list mechanics.
- Retail media/coupon monetization model is obvious.

**Gaps GroceryView can fill**

- Flyer-first products often display promotions without proving whether the offer is historically strong.
- Flyer data is not always normalized into exact SKU/unit-price intelligence.
- Flipp is not Stockholm-native and does not solve Swedish member prices, local chains, Swedish private labels, or local language/product-taxonomy issues.
- It is weak on budget tracking and receipt feedback.

**Strategic implication**

GroceryView should borrow Flipp's low-friction deal discovery, but differentiate with a hard claim: **every offer is scored, contextualized, and tied to price history**.

---

### 4.3 Keepa

**Category:** Amazon price history and alerts.  
**Relevance:** Best reference for price-history charts and alert mechanics.

**Current positioning and capabilities**

- Keepa tracks over 5 billion Amazon products and provides price-history charts and price-drop alerts. Source: [Keepa official site](https://keepa.com/).
- The mobile/app listings emphasize price and sales-rank history plus alerts. Source: [Keepa Google Play](https://play.google.com/store/apps/details?id=com.keepa.mobile).

**Strengths**

- Strong chart-first trust pattern: users can see whether a deal is real.
- Target-price alerts and watchlists map directly to grocery staples.
- Embedded browser-extension workflow proves that price intelligence can live at point of purchase.
- Long-running data moat and API/seller analytics show B2B potential.

**Gaps GroceryView can fill**

- Keepa is Amazon-centric, not local grocery-centric.
- It does not handle fresh products, store-level local variation, member prices, multi-buy mechanics, or private-label substitutions.
- It does not plan a weekly basket or household grocery budget.

**Strategic implication**

GroceryView should make grocery product pages feel like Keepa, but add local store comparisons, percentiles, deal scores, equivalents, nutrition, and basket impact.

---

### 4.4 Yuka

**Category:** Barcode scanner, nutrition/cosmetics scoring.  
**Relevance:** Reference for instant clarity, trusted scoring, and product alternatives.

**Current positioning and capabilities**

- Yuka scans food and cosmetic barcodes and gives users a clear analysis, product score, and healthier recommendations. Source: [Yuka app page](https://yuka.io/en/app).
- Its App Store listing claims 80 million users and emphasizes independence from brands. Source: [Yuka App Store](https://apps.apple.com/us/app/yuka-food-cosmetic-scanner/id1092799236).
- Yuka reports a database of millions of food and cosmetic products. Source: [Yuka app page](https://yuka.io/en/app).

**Strengths**

- Excellent mobile scan UX.
- Simple score converts complex product data into a fast decision.
- Trust narrative: independent, objective, no brand funding.
- Alternative recommendations create actionable next steps.

**Gaps GroceryView can fill**

- Yuka does not solve where the product is available locally or whether its current price is good.
- It has no basket, budget, favorite-store, or price-history lens.
- Nutrition scoring alone can miss the user's real constraint: "healthy enough within budget this week."

**Strategic implication**

GroceryView's barcode scan should return a combined view: **price score + deal score + nutrition-per-krona + cheaper/healthier swaps nearby**.

---

### 4.5 Bring!

**Category:** Shared grocery lists and recipe planning.  
**Relevance:** Reference for household collaboration and repeated weekly use.

**Current positioning and capabilities**

- Bring! offers shared shopping lists for families, partners, flatmates, and groups, including real-time list synchronization and participant messaging. Source: [Bring collaborative lists](https://www.getbring.com/en/features/collaborative).
- Bring! also supports recipe inspiration and adding recipe ingredients directly to shopping lists. Source: [Bring recipe features](https://www.getbring.com/en/features/inspired).

**Strengths**

- Daily/weekly utility; not only used during sales periods.
- Household sharing is simple and memorable.
- Recipe-to-list flow solves planning friction.
- Visual item tiles and simple quantity handling reduce cognitive load.

**Gaps GroceryView can fill**

- Bring! is not price-intelligent.
- It does not know whether the list is affordable, where it is cheapest, or whether the user is about to exceed budget.
- It does not convert store flyers or product histories into shopping decisions.

**Strategic implication**

GroceryView's Weekly Basket should feel as simple as Bring!, but every item should carry price intelligence, confidence, alternatives, and budget impact.

---

### 4.6 PriceRunner

**Category:** General e-commerce price comparison.  
**Relevance:** Swedish-origin reference for broad comparison, price history, alerts, and fake-deal detection.

**Current positioning and capabilities**

- PriceRunner says it compares millions of products across thousands of stores in Sweden. Source: [PriceRunner Sweden](https://www.pricerunner.se/).
- PriceRunner's member-feature page explains price history, price alerts, saved products/lists, and using history to avoid misleading campaign prices. Source: [PriceRunner features](https://www.pricerunner.se/info/pricerunner-features).
- PriceRunner states that it is independent and became part of Klarna in 2022. Source: [PriceRunner about](https://www.pricerunner.se/info/about-pricerunner).

**Strengths**

- Strong consumer trust pattern in Sweden.
- Price history and alerts are familiar to users.
- Broad product catalog and store coverage.
- Reviews, shop information, payment/delivery filters help high-consideration purchases.

**Gaps GroceryView can fill**

- PriceRunner is optimized for durable goods and e-commerce, not repeated weekly grocery baskets.
- It does not solve fresh-food equivalence, local physical store variation, member prices, household budgets, receipt analytics, or nutrition-per-krona.
- It is product-by-product, not week-by-week basket-first.

**Strategic implication**

GroceryView can use PriceRunner's trust vocabulary: price history, alerts, fake-deal avoidance. The wedge is groceries' higher frequency and local complexity.

---

### 4.7 PriceSpy / Prisjakt

**Category:** General product and price comparison.  
**Relevance:** Swedish/Nordic comparison incumbent; useful reference for product specs, reviews, price history, alerts, and international brand localization.

**Current positioning and capabilities**

- Prisjakt describes itself as a leading objective product and price comparison service in the Nordics, operating in several markets and under local brands such as PriceSpy. Source: [Prisjakt about](https://investors.prisjakt.nu/about-prisjakt/).
- Prisjakt's app page describes wishlists, price monitoring, price alerts, price history, and barcode scanning; PriceSpy's UK page describes price comparison, price alerts, trends, and in-store barcode scanning under the PriceSpy brand. Sources: [Prisjakt app](https://www.prisjakt.nu/tema/app), [PriceSpy mobile app](https://pricespy.co.uk/mobile-app--ecZXcBxBcAACUAeBbG), [PriceSpy price history](https://pricespy.co.uk/information/price-history).
- Recent Swedish news and user discussion indicate merchant frustration around pricing/click-cost changes at Prisjakt, which may create trust and coverage vulnerabilities. Source: [SvD March 2026 article](https://www.svd.se/a/5pEL91/cdon-och-jollyroom-rasar-mot-prisjakts-hoga-priser-hoppar-av).

**Strengths**

- Familiar Swedish comparison brand.
- Excellent model for product detail, price history, alerts, and technical specifications.
- Multi-market experience.
- User reviews and shop ratings create trust beyond price.

**Gaps GroceryView can fill**

- Like PriceRunner, it is not built around local grocery baskets.
- It struggles to map to supermarket-specific SKUs, fresh items, local store inventory, and member prices.
- Grocery users need a weekly workflow, not occasional high-consideration purchase research.
- Merchant-paid traffic economics can conflict with a pure consumer-side grocery intelligence promise.

**Strategic implication**

GroceryView should be the **Prisjakt/PriceSpy for groceries plus Keepa charts plus Bring household lists**, but should make source confidence and data independence explicit.

---

## 5. Stockholm and Sweden-specific grocery app landscape

### 5.1 Matpriskollen

**Category:** Swedish grocery prices, offers, shopping lists, price insights.  
**Threat level:** High; closest local incumbent.

**Current positioning and capabilities**

- Matpriskollen calls itself Sweden's largest independent, free food-price service and app. Source: [Matpriskollen app download page](https://matpriskollen.se/ladda-ner-appen).
- Its terms describe a service for building a digital grocery basket, comparing prices in stores, seeing current offers, product watches, shopping lists, and recipes based on current offers. Source: [Matpriskollen terms](https://matpriskollen.se/allmanna-villkor-matpriskollen).
- Google Play copy says users can choose favorite stores across ICA, Coop, Willys, City Gross, Ö&B, Rusta, Hemköp, Lidl and others, and that the service includes scan/search price comparison. Source: [Matpriskollen Google Play](https://play.google.com/store/apps/details?hl=en-US&id=se.easyapp.matpriskollen).
- Matpriskollen publishes food price analyses and reports that have media and policy relevance. Source: [Matpriskollen current articles](https://matpriskollen.se/aktuellt).

**Strengths**

- Strong Swedish brand and user mindshare.
- Clear savings proposition.
- Weekly offer aggregation across many Swedish chains.
- Favorite stores, watches, shopping lists, and emerging current-price comparison.
- B2B data/reporting credibility.

**Gaps GroceryView can fill**

- The user experience is still closer to offer comparison than a **market terminal**.
- Historical charts, 52-week ranges, percentile bands, and trading-style screeners are not the central product grammar.
- It is not obviously centered on personal budgets, receipt analytics, nutrition-per-krona, private-label substitution, or household inflation dashboards.
- Matpriskollen terms note reliance on third-party information and no responsibility for its accuracy; GroceryView can differentiate with source-confidence labels, community verification, and verified-vs-estimated chart styling.
- There is room for a Stockholm-first product with very high local density, local store pages, neighborhood indices, and SEO pages.

**Strategic response**

Do not compete head-on as "Matpriskollen but newer." Compete as:

> Matpriskollen helps you find offers. GroceryView helps you understand the grocery market and decide what to buy this week.

Minimum bar: GroceryView must match favorite stores, offers, shopping lists, item search, and basic comparisons. Differentiation must come from price history, deal score, budget loop, and market-index UX.

---

### 5.2 Matspar

**Category:** Swedish online grocery price comparison.  
**Threat level:** Medium-high for basket comparison; lower for physical-store terminal.

**Current positioning and capabilities**

- Matspar describes itself as a price-comparison service for grocery shopping that aggregates online grocery assortments in one place, lets users compare while building a basket, and claims users can save up to 30%. Source: [Matspar about](https://www.matspar.se/om-oss).
- It emphasizes daily price comparison rather than annual market surveys. Source: [Matspar about](https://www.matspar.se/om-oss).

**Strengths**

- Clear basket-comparison use case.
- Online grocery focus makes checkout handoff and delivery availability relevant.
- Good answer for "which online store should I order from?"

**Gaps GroceryView can fill**

- Online focus misses many physical Stockholm store opportunities.
- It is not a chart-first historical price product.
- It is not optimized around product tickers, watchlists, price alerts, favorite-store movers, receipt analytics, or grocery indices.
- It is less suited for users who decide among Willys Odenplan, Lidl Sveavägen, Coop Fridhemsplan, local ICA, and Mathem together.

**Strategic response**

Use Matspar as proof of basket-comparison demand. GroceryView should exceed it on local physical stores, price history, deal scoring, and post-purchase analytics.

---

### 5.3 Matbit

**Category:** Swedish grocery basket comparison app.  
**Threat level:** Medium; direct concept overlap, uncertain current scale.

**Current positioning and capabilities**

- Matbit is presented as an iOS/Android grocery and price comparison app for Sweden, comparing products across Coop, ICA, Mathem, Willys, City Gross, and Hemköp. Source: [Matbit / QuidBit case page](https://quidbit.se/food/).
- The case page claims 120k+ products in its database, six stores compared, basket totals, brand comparison, and filters for eco-labelled alternatives. Source: [Matbit / QuidBit case page](https://quidbit.se/food/).

**Strengths**

- Strong conceptual overlap with list-based Swedish grocery comparison.
- Mobile-first.
- Real-time price and basket comparison positioning.
- Sustainability/eco filters.

**Gaps GroceryView can fill**

- Limited chain set versus the full Stockholm shopping reality.
- No clear evidence of a deep price-history terminal, alerts, receipt analytics, household budgets, or market indices.
- Appears more like a product/design case than a dominant consumer brand.

**Strategic response**

GroceryView can absorb the same basket-comparison job but add a defensible data moat: history, receipts, community verification, and indices.

---

### 5.4 Nätmat / Natmat

**Category:** Swedish online grocery price comparison and multi-store online-shopping helper.  
**Threat level:** Medium-high for online basket comparison; lower for in-store terminal and price-history workflows.

**Current positioning and capabilities**

- Nätmat/Natmat positions itself as "Sveriges smartaste matshopping" and lets users enter a postcode to compare online grocery assortments and delivery availability. Source: [Natmat](https://www.natmat.se/).
- It says users can compare prices across milk, fish, bread, hygiene products and other categories, while also comparing delivery terms, freight prices, campaigns, and organic products. Source: [Natmat](https://www.natmat.se/).
- Product pages show best price by chain and specific Stockholm stores, e.g. Hemköp Stockholm Vällingby C, Willys Botkyrka Handel, and City Gross Häggvik. Source: [Natmat example product](https://www.natmat.se/produkt/Kvarg-Naturell-0%2C3%25-101232098_ST).

**Strengths**

- Clear online-shopping comparison proposition: price plus delivery conditions.
- Store-specific Stockholm examples make it more concrete than generic national price comparison.
- Campaign, organic, freight, and delivery-time filters address practical online grocery tradeoffs.

**Gaps GroceryView can fill**

- The workflow is still "where can I buy/order this now?", not "is this price historically good and how should it affect my weekly plan?"
- It does not appear to center chart-first price history, 52-week ranges, grocery screeners, market heatmaps, receipt analytics, or household budget reconciliation.
- Online delivery terms are useful, but GroceryView's proposal explicitly avoids optimizing away distance by default; GroceryView can support both physical-store bargain hunters and online-delivery users through selectable scopes.

**Strategic response**

Treat Nätmat/Natmat as an important Swedish online-basket benchmark. GroceryView should not ignore delivery conditions, but should win on cross-channel decision intelligence: physical stores, delivery channels, favorite-store watchlists, true-deal scores, and post-purchase receipt loops.

---

### 5.5 PRISSPAR

**Category:** Swedish web app for local grocery prices, offers, and basket comparison.  
**Threat level:** Medium; early but directly aligned.

**Current positioning and capabilities**

- PRISSPAR says it compares grocery prices, weekly offers, and cheapest baskets in stores near the user; it supports postcode, chain and store filters, offer browsing, and shopping-list building. Source: [PRISSPAR](https://www.prisspar.se/).

**Strengths**

- Very close to the GroceryView MVP problem statement.
- Locality and selected-store workflow fits the proposal's "selected scope" principle.
- Web-first simplicity may be good for SEO and low-friction entry.

**Gaps GroceryView can fill**

- Needs stronger product identity, mobile habit loop, historical charts, alerts, budget tracking, receipts, and confidence labels.
- Appears utility-first rather than terminal/market-intelligence-first.
- GroceryView can create better editorial and visual language: heatmaps, movers, 52-week lows, category indices, and watchlists.

**Strategic response**

Monitor closely. This validates the exact opportunity. GroceryView must launch with a distinctive UX and stronger data-story, not just similar search/list screens.

---

### 5.6 Kvittovakten

**Category:** Swedish receipt/order-history analytics, currently Mathem-oriented.  
**Threat level:** Medium for receipt analytics; complementary for wider market view.

**Current positioning and capabilities**

- Kvittovakten analyzes Mathem receipts/order history through a browser extension, showing spending insights, cheaper alternatives, price history, and product-level Mathem price pages. Source: [Kvittovakten](https://kvittovakten.se/).
- Its category pages publish Mathem product prices and state that data is community-aggregated and should be checked against the retailer. Source: [Kvittovakten Mathem category prices](https://kvittovakten.se/priser/kategori/mejeri-ost-juice).

**Strengths**

- Excellent wedge: start from user receipts/orders instead of trying to scrape the whole market first.
- Product-level history and personal spend insights are close to GroceryView's receipt analytics vision.
- Mathem focus may make data extraction easier and immediate.

**Gaps GroceryView can fill**

- Mathem-only or Mathem-first is too narrow for Stockholm's multi-store reality.
- Browser extension is less universal than mobile receipt scan, email receipt import, loyalty-card integrations, and manual/community observations.
- Needs broader basket and physical-store comparison.

**Strategic response**

GroceryView should prioritize receipt/order ingestion early. Kvittovakten proves this is an active Swedish niche; GroceryView should make it cross-retailer and mobile-first.

---

### 5.7 Matmoms, Comparator, and Matindex

**Category:** Swedish grocery price tracking / comparison websites.  
**Threat level:** Medium; important signal that "daily/weekly grocery price data" is becoming a product category.

**Current positioning and capabilities**

- Matmoms presents itself as daily grocery price monitoring for ICA, Coop, and Willys, and says it collects daily prices in Stockholm plus other Swedish cities. Source: [Matmoms](https://matmoms.se/).
- Matmoms is timely because it explicitly tracks how the 2026 food VAT reduction reaches consumers. Source: [Matmoms](https://matmoms.se/).
- Comparator Sverige publishes a Stockholm-based weekly grocery basket across Willys, Coop, and ICA, includes week-over-week basket changes, and notes that its figures include single-item weekly offers but not multi-buy deals. Source: [Comparator grocery prices](https://comparator.se/en/grocery).
- Matindex is a web-based Swedish food price comparison project; the public page currently requires JavaScript, but Swedish user discussion describes it as a Matpriskollen-like website with weekly price collection. Source: [Matindex](https://www.matindex.se/), [Reddit discussion](https://www.reddit.com/r/sweden/comments/1ktklh0).

**Strengths**

- Web-first, SEO-friendly surfaces can acquire users without app install friction.
- Matmoms' daily collection promise directly attacks the "prices are changing too fast" pain.
- Comparator's basket-week reporting validates the editorial/index surface in GroceryView's proposal: users can understand movement without building a basket first.
- Coverage of Stockholm by name makes the competitive signal especially relevant for GroceryView's launch market.

**Gaps GroceryView can fill**

- Matmoms and Comparator are chain-limited and data-feed/editorial-first; they do not yet express the broader weekly basket, household, receipt, nutrition, private-label, and TradingView-style market-terminal vision.
- Comparator explicitly excludes multi-buy offers and warns that smaller stores may vary, leaving room for GroceryView to model messy real-world terms and store-level confidence.
- Index or comparison projects can become static dashboards unless they create a personal habit loop: watchlists, alerts, budgets, receipt reconciliation, and shared lists.
- A web-only or data-table UX leaves room for GroceryView to win with mobile scanning, in-store use, and richer product ticker pages.

**Strategic response**

Treat Matmoms and Comparator as direct warnings: daily/weekly grocery price comparison is not a future idea; it is already appearing in Sweden. GroceryView must differentiate through deeper decision workflows, not just fresher price tables.

---

### 5.8 Rezepta

**Category:** Swedish grocery price comparison, recipe planning, and basket optimization.  
**Threat level:** Medium-high if its mobile roadmap ships; it is close to GroceryView's price-aware weekly planning idea, though currently less Stockholm-specific and less market-terminal-oriented.

**Current positioning and capabilities**

- Rezepta presents itself as an independent Swedish grocery price comparison service for finding the cheapest store for weekly shopping. Source: [Rezepta](https://rezepta.app/en).
- It compares ICA, Coop, Willys, Hemköp, MatHem, Lidl, and City Gross, and says it covers 21,000+ products. Source: [Rezepta](https://rezepta.app/en).
- It blends product search, weekly offers, recipes with price comparison, basket comparison, budget planning, and receipt upload; the footer states price data comes from Matspar. Source: [Rezepta](https://rezepta.app/en).
- Its page says iOS and Android apps are coming in 2026 with in-store list use, receipt scanning, and price alerts. Source: [Rezepta](https://rezepta.app/en).

**Strengths**

- Strong convergence of recipes, weekly planning, basket comparison, receipt upload, and price alerts.
- Seven-chain scope is broader than some chain-limited comparison projects.
- Recipe-led flows may be easier for mainstream households than a raw product database.
- If price data is sourced from Matspar, Rezepta can move quickly on UX and meal planning without building the full data pipeline first.

**Gaps GroceryView can fill**

- Rezepta appears recipe/planning-first rather than terminal/market-data-first.
- It does not yet clearly own store-level Stockholm density, physical-store verification, neighborhood indices, chart-first product pages, 52-week ranges, or true-deal percentile scoring.
- Reliance on another comparison provider's price data may weaken defensibility and source provenance.
- The mobile app appears planned rather than fully established, which leaves a window for GroceryView to define the stronger Stockholm-native habit loop.

**Strategic response**

Monitor Rezepta closely because it packages many P1 GroceryView-adjacent features in one consumer-friendly flow. GroceryView should respond by making the core data layer visibly superior: verified store observations, historical charts, percentiles, deal scores, confidence badges, and a stronger Stockholm neighborhood taxonomy.

---

### 5.9 Dayli, Matpris, Veckans 200, Fiffit, Rabble

**Category:** Swedish/Nordic deal, flyer, cashback, local-sale apps.  
**Threat level:** Low-medium; useful acquisition/feature benchmarks.

**Current positioning and capabilities**

- Dayli aggregates current offers, flyers, inspiration, favorite products, and planning across stores/webstores. Source: [Dayli](https://dayli.se/).
- Matpris provides a simple overview of grocery offers across Sweden. Source: [Matpris App Store](https://apps.apple.com/se/app/matpris/id702243892).
- Veckans 200 surfaces weekly offers from City Gross, Coop, Hemköp, ICA, and Willys, with selected offers added to a digital shopping list. Source: [Veckans 200](https://www.veckans200.se/).
- Fiffit focuses on discounted items in local stores, reserve/pick-up workflows, and supporting local retailers. Source: [Fiffit](https://www.fiffit.com/).
- Rabble offers grocery and online cashback via app offers and receipt upload. Source: [Rabble](https://www.rabble.se/).

**Strengths**

- Simple savings hooks.
- Low-friction deal browsing.
- Some local-store and receipt-upload mechanics.
- Merchant-funded monetization potential.

**Gaps GroceryView can fill**

- These products are generally offer/cashback-first, not intelligence-first.
- They do not build a full price history graph per product or store.
- They do not close the loop from offer discovery to weekly budget, actual receipt, and personal inflation.

**Strategic response**

Use them as top-of-funnel inspiration: GroceryView's free tier can include a better local deal feed, but conversion should be to watchlists, baskets, alerts, and budgets.

---

### 5.10 Chain apps: ICA, Coop, Willys, Hemköp, Lidl Plus, City Gross

**Category:** Retailer-owned loyalty, offers, self-scan, e-commerce, receipt apps.  
**Threat level:** High for attention and first-party data; low for neutrality.

**Current positioning and capabilities**

- ICA app: smart shopping lists, offers from favorite stores, personal offers, store finder, dinner tips, and mobile payment for ICA cards. Source: [ICA app](https://www.ica.se/appar-och-tjanster/appen-ica/).
- Coop app: weekly offers/campaigns for chosen Coop store, smart shopping list, personal offers/bonus, Scan & Pay, online shopping. Source: [Coop App Store](https://apps.apple.com/se/app/coop-mat-erbjudanden-medlem/id408840395).
- Willys app: current offers, e-commerce, Scan&Go, shopping lists shared with household members, store info, and Willys Plus savings. Source: [Willys app](https://www.willys.se/artikel/om-willys-appen).
- Hemköp app: lists, barcode add-to-list, e-commerce, store offers/flyers, personal offers, recipes, club points, and scan/pay in selected stores. Source: [Hemköp app](https://www.hemkop.se/artikel/mobilapp).
- Lidl Plus: digital loyalty card, coupons, member offers, digital flyers, receipts, scratch-card mechanics, and store finder. Source: [Lidl Plus Sweden](https://www.lidl.se/c/lidl-plus/s10017033).
- City Gross app: offers, shopping lists, Prio membership, digital receipts, self-scanning, personal offers, and chosen-store information. Source: [City Gross Google Play](https://play.google.com/store/apps/details?hl=sv&id=se.radx.citygross).

**Strengths**

- Own the in-store and checkout relationship.
- Strong loyalty incentives and personal offers.
- Digital receipts and self-scanning create rich first-party data.
- Users already have these apps installed for the stores they use.

**Gaps GroceryView can fill**

- Each chain app is structurally biased toward its own chain.
- They cannot credibly tell the user "do not buy from us this week."
- Cross-chain equivalents, true historical deal validation, and neutral budget planning remain open.
- Personal offers are opaque; GroceryView can help users track whether personalized pricing is actually useful.
- Receipts are scattered by chain; GroceryView can unify household grocery history.

**Strategic response**

GroceryView should not try to replace chain apps at checkout. It should sit **before and after** checkout: decide the plan, then analyze what happened.

---

### 5.11 Delivery and quick-commerce apps: Wolt Market, foodora, Picsmart

**Category:** Grocery delivery / marketplace.  
**Threat level:** Medium for convenience users; low for neutral intelligence.

**Current positioning and capabilities**

- Wolt Market Sweden positions itself as weekly groceries delivered quickly, with a freshness guarantee and in-app Wolt Market experience. Source: [Wolt Market Sweden](https://explore.wolt.com/en/swe/wolt-market).
- Wolt's Stockholm pages show Wolt Market and local grocery venues such as ICA and Coop available through the Wolt app. Sources: [Wolt Market Stockholm](https://wolt.com/en/swe/stockholm/venue/wolt-market-stockholm-city), [Wolt Stockholm](https://wolt.com/en/nor/stockholm).
- foodora Sweden says the app can deliver restaurant food, groceries, and items from local stores. Source: [foodora Sweden app](https://www.foodora.se/en/contents/app).
- Picsmart says it delivers groceries from local stores rather than an anonymous warehouse, with same-day delivery. Source: [Picsmart](https://picsmart.se/).

**Strengths**

- Convenience and speed.
- Good mobile ordering and payment flows.
- High urban relevance in Stockholm.
- Can expose local store inventory without users visiting chain apps.

**Gaps GroceryView can fill**

- Delivery marketplaces optimize for immediate purchase, not weekly budget or price history.
- Their price, fee, markup, and substitution tradeoffs are hard to compare with physical shopping.
- They do not give a neutral "wait/buy/switch store" verdict.

**Strategic response**

GroceryView should include delivery channels in price comparisons but preserve user-controlled scope: "my delivery options," "my walkable stores," "my favorite stores," and "all Stockholm."

---

### 5.12 Surplus and expiry-discount apps: Karma, Too Good To Go, Matsmart/Motatos

**Category:** Food rescue / surplus purchase.  
**Threat level:** Low for core weekly groceries; useful adjacency.

**Current positioning and capabilities**

- Karma was founded in Stockholm and lets retailers sell surplus food to consumers at lower prices instead of wasting it. Source: [Visit Stockholm: Karma](https://www.visitstockholm.com/o/karma/).
- Too Good To Go connects consumers with surplus food from restaurants, bakeries, grocery stores, and other food businesses through discounted surplus bags. Source: [Too Good To Go overview](https://en.wikipedia.org/wiki/Too_Good_To_Go), [Too Good To Go surplus-food app description](https://www.prnewswire.com/news-releases/on-demand-grocery-delivery-apps-go-zero-waste-with-too-good-to-go-301466970.html).
- Matsmart/Motatos is an online surplus grocery retailer that buys surplus from FMCG suppliers and sells it cheaply online in Sweden and other European markets; its app is published by a Stockholm-addressed company. Sources: [Matsmart/Motatos company page](https://people.matsmart.se/), [Matsmart Google Play](https://play.google.com/store/apps/details?id=com.matsmart.app).

**Strengths**

- Strong savings and sustainability story.
- Local, timely, and mobile-native.
- Can create delightful bargain moments.

**Gaps GroceryView can fill**

- Surplus apps are opportunistic, not full basket planners.
- Inventory is unpredictable and often not staple-specific.
- They do not provide regular price history or price indices.
- Matsmart/Motatos is more like discounted e-commerce than store-level Stockholm price intelligence; it does not tell users whether a normal weekly staple is a true deal at their chosen local stores.

**Strategic response**

Yellow-sticker/surplus radar is a P2 opportunity, not the MVP wedge. Integrate only when it supports normal grocery planning.

---

### 5.13 Stockholm-specific independent grocers and local-deal channels: Matdax, Matvärlden, Matcenter, local SMS/VIP clubs

**Category:** Local grocery retailers and informal deal channels rather than pure apps.  
**Threat level:** Medium for data completeness; low for software UX.

**Current positioning and capabilities**

- Matdax describes itself as a price-pressure grocery operator in south Stockholm since 1992, with stores in Hagsätra, Högdalen, and Hökarängen. Source: [Matdax](https://www.matdax.se/), [Matdax about](https://www.matdax.se/om-oss/).
- Matdax publishes weekly offers and operates a local VIP club that sends its best offers by SMS. Source: [Matdax VIP club](https://www.matdax.se/matdax-vip-klubb/).
- Matvärlden is a Stockholm-area international grocery chain with stores in Kungens Kurva, Veddesta, and Tensta, positioning around broad world-food assortment, low prices, and weekly offers. Source: [Matvärlden](https://www.matvarlden.se/).
- Rinkeby/Hallonbergen Matcenter-type stores and local chains such as Matöppet show the same pattern: strong neighborhood assortments, weekly offers or VIP clubs, but fragmented digital surfaces. Sources: [Rinkeby Matcenter](https://rinkebycentrum.se/butiker/rinkeby-matcenter), [Matcenter VIP club](https://www.matcenterfamiljen.se/matcenter-vip-klubb/), [Matöppet Mosebacke](https://www.matoppet.se/butik/mosebacke/).
- Stockholm user discussions frequently mention Matdax, Matvärlden, Matcenter, Lidl, and Willys as cheap-shopping options, especially outside the inner-city convenience-store pattern. Sources: [r/stockholm grocery-cost discussion](https://www.reddit.com/r/stockholm/comments/1gby5vv), [r/TillSverige Stockholm grocery discussion](https://www.reddit.com/r/TillSverige/comments/13grwy4).

**Strengths**

- Local stores can have aggressive prices and culturally specific assortments that national app datasets may miss.
- SMS/VIP clubs and paper flyers reach bargain shoppers without requiring a sophisticated app.
- These retailers are very relevant to the proposal's instruction not to penalize distance automatically: some users will travel for savings.

**Gaps GroceryView can fill**

- Local offers are fragmented across websites, SMS clubs, PDFs, signs, social posts, and word of mouth.
- Existing national comparison tools may under-cover independent, ethnic, small-chain, or neighborhood grocers, even when they are important for Stockholm budgets.
- These stores often compete on culturally specific assortment and bulk/value formats rather than clean SKU parity, creating a harder but more defensible equivalence/substitution problem for GroceryView.
- Users need "is it worth a trip?" information without hard-coding travel-time penalties: show price delta, basket saving, opening hours, transit notes, and confidence.

**Strategic response**

GroceryView should include a "Stockholm local bargains" data lane after the first chain-store MVP. Even a small verified panel of Matdax/Matvärlden/Matcenter/Matöppet staples could make the product feel truly local rather than a generic national comparator.

---

### 5.14 Emerging meal-planning, pantry, and receipt apps: Smaklig, SmartaMenyn, Veckomat, Matdags, GroceryGlow, GroceryPlus

**Category:** AI meal planning, receipt scanning, budget tracking.  
**Threat level:** Medium over time; validates GroceryView's P1/P2 features.

**Current positioning and capabilities**

- Smaklig is an AI weekly meal planner for Swedish households that combines weekly campaigns from chains such as ICA, Coop, Hemköp, City Gross, Lidl, Willys, and Costco with goals, allergies, and taste preferences. Source: [Smaklig](https://smaklig.app/en).
- SmartaMenyn is a Stockholm-built web product that creates weekly menus from current offers at stores the user actually shops in, with recipes and store-sorted shopping lists; it supports ICA, Coop, Hemköp, and Lidl. Source: [SmartaMenyn](https://www.smartamenyn.se/).
- Veckomat is a Malmö/Stockholm beta app for personalized recipes based on weekly discounts, favorite stores, and discount scanning for ingredients. Source: [Veckomat](https://veckomat.com/).
- Matdags is a Stockholm-area/Danderyd-addressed AI app for reducing home food waste; it lets users photograph the fridge, scan receipts or barcodes, track expiry dates, and get recipes from food already at home. Sources: [Matdags](https://www.matdags.se/), [Matdags Google Play](https://play.google.com/store/apps/details?id=com.matdags.matdagsandroid).
- GroceryGlow and GroceryPlus App Store listings describe receipt scanning, item extraction, price history/trends, budgets, alerts, and shared lists. Sources: [GroceryGlow App Store](https://apps.apple.com/se/app/groceryglow/id6758956139), [GroceryPlus App Store](https://apps.apple.com/se/app/groceryplus/id6757016060).

**Strengths**

- AI planning and receipt OCR are becoming expected capabilities.
- Pantry and expiry tracking make the "what should I buy?" question depend on what the household already owns.
- Budget and trend insights address real pain.
- Meal planning based on campaigns can save users time and money.

**Gaps GroceryView can fill**

- Meal planners usually lack a robust price-history market layer; they optimize "what to cook from this week's offers," not "is this offer a true 52-week low?"
- Generic receipt apps often lack local store-level price intelligence and verified offer data.
- GroceryView can combine both directions: external market data plus internal receipt history.
- Pantry apps do not usually know whether replenishing today is a good deal or whether a cheaper equivalent exists nearby.
- Recipe-first products may hide price transparency behind meals; GroceryView can show both meal impact and product-level market truth.

**Strategic response**

Receipt OCR, pantry state, and meal planning should not be treated as distant nice-to-haves. They are emerging competitor features and should shape P1 priorities after the core price/history wedge is credible. GroceryView should avoid being outflanked by meal-planning apps that make weekly offers actionable, while still defending the deeper price-history terminal position.

---

## 6. International inspiration from the proposal

The proposal also names several non-Swedish comparators. They are less direct launch-market threats than Matpriskollen, Matspar, Natmat, PRISSPAR, Rezepta, and the chain apps, but they sharpen the feature bar for GroceryView.

### 6.1 Trolley, Basket, and Frugl

**Category:** Grocery price-comparison and basket-comparison apps outside Sweden.  
**Relevance:** Proof that grocery-specific comparison can become a standalone consumer behavior, not only a retailer feature.

**Current positioning and capabilities**

- Trolley in the UK positions itself as a supermarket price-comparison app with 200,000+ products, 16+ supermarkets, barcode scanning, lists, supermarket list comparison, price alerts, and price-drop discovery. Sources: [Trolley app](https://www.trolley.co.uk/app/), [Trolley price alerts](https://www.trolley.co.uk/CODE_RED_static_pages/price_alert.html).
- Basket in the US has positioned around local and online grocery price comparison, in-store unadvertised sales, coupons, list-level store totals, and crowdsourced price data. Sources: [Basket App Store](https://apps.apple.com/us/app/basket-grocery-shopping/id1060139875?l=uk), [FoodNavigator-USA Basket interview](https://www.foodnavigator-usa.com/Article/2019/01/04/Waze-for-groceries-Basket-app-deploys-crowdsourcing-for-real-time-pricing-info/).
- Frugl in Australia positions as a grocery price-comparison companion and has published grocery price-index style reporting. Sources: [Frugl](https://www.frugl.com.au/), [Frugl GPI ASX release](https://www.asx.com.au/asxpdf/20220720/pdf/45c0cqks129ml8.pdf).

**Strengths**

- They validate list/basket comparison, barcode scanning, price alerts, and grocery-specific price indices.
- Trolley demonstrates that SKU-scale grocery comparison can be framed as a mainstream savings app.
- Basket shows the power and fragility of community/crowdsourced price collection.
- Frugl validates the editorial "grocery price index" surface that GroceryView wants for Stockholm.

**Gaps GroceryView can fill**

- These services are market-specific and do not solve Swedish chains, Swedish member pricing, Stockholm neighborhoods, or Swedish private-label equivalence.
- They are closer to comparison utilities than full decision terminals; charts, 52-week ranges, percentile bands, household budgets, receipts, and nutrition-per-krona are not usually the primary grammar.
- Crowdsourcing can create data freshness and trust issues unless provenance, verification, and anomaly detection are surfaced clearly.

**Strategic response**

GroceryView should treat Trolley/Frugl/Basket as proof that the category is viable, then differentiate locally with **Stockholm store-level density + Keepa-style history + budget/receipt loops + confidence labels**.

### 6.2 KaufDA and Tokubai

**Category:** Digital flyers, local offers, and coupons.  
**Relevance:** International benchmarks for replacing supermarket paper circulars with searchable local offers.

**Current positioning and capabilities**

- KaufDA in Germany aggregates local brochures, flyers, and offers across hundreds of retailers through web and app. Sources: [kaufDA](https://www.kaufda.de/), [kaufDA App Store](https://apps.apple.com/de/app/kaufda-prospekte-angebote/id365527345).
- Tokubai in Japan is a large free flyer and coupon app covering supermarket and retail chains, with today's flyers, coupons, and store-based browsing. Source: [Tokubai Google Play](https://play.google.com/store/apps/details?id=jp.co.tokubai.android.bargain).

**Strengths**

- Extremely simple consumer proposition: "what is on offer near me today?"
- Strong local-retailer and flyer ingestion workflows.
- Habitual weekly browsing behavior and merchant-funded monetization potential.

**Gaps GroceryView can fill**

- Flyer apps do not necessarily normalize offers into exact SKUs, unit prices, member/multi-buy terms, and historical percentiles.
- They do not answer the proposal's central question: "is this deal real, and should I buy now or wait?"
- They are weak on personal basket impact, household budgets, receipt analytics, and long-term price history.

**Strategic response**

GroceryView should make weekly flyers feel like **structured market events**: promotion markers on charts, true-deal scoring, unit-price normalization, and basket-level impact.

### 6.3 Open Food Facts and AnyList

**Category:** Open product database / household list workflow.  
**Relevance:** Inputs and UX references for barcode, nutrition, recipes, and repeated shopping.

**Current positioning and capabilities**

- Open Food Facts is a crowdsourced global food-product database with ingredients, nutrition, allergens, labels, packaging, and barcode-based product data. Source: [Open Food Facts](https://world.openfoodfacts.org/).
- AnyList offers grocery list sharing, recipes, meal planning, cross-device apps, favorite/recent items, custom categories, and recurring weekly-shopping workflows. Sources: [AnyList](https://www.anylist.com/), [AnyList weekly shopping help](https://help.anylist.com/articles/weekly-shopping/).

**Strengths**

- Open Food Facts can accelerate barcode/product enrichment, especially for nutrition and ingredients.
- AnyList proves that repeated household shopping is a collaboration problem, not only a price problem.
- Both reinforce that GroceryView should make scanning and shared lists fast before adding advanced analytics.

**Gaps GroceryView can fill**

- Open Food Facts is a data commons, not a local price or availability product.
- AnyList is list/recipe-first and does not provide cross-retailer price intelligence, true-deal validation, or receipt-based budget reconciliation.
- Neither is Stockholm-specific.

**Strategic response**

Use Open Food Facts-style product data and AnyList-style low-friction collaboration as enabling layers, but make GroceryView's differentiated layer the **local price graph and decision engine**.

### 6.4 Flashfood and Olio

**Category:** Surplus, near-expiry, and community food-sharing.  
**Relevance:** The proposal lists surplus/expiry apps as inspiration, but not the core MVP.

**Current positioning and capabilities**

- Flashfood lets users buy discounted grocery items from participating local stores and pick them up in-store; its retailer-facing materials emphasize reducing shrink and selling near-date or overstocked items. Sources: [Flashfood](https://flashfood.com/), [Flashfood help](https://help.flashfood.com/hc/en-us/articles/360049204914-What-is-Flashfood), [Flashfood retailer one-pager](https://hub.flashfood.com/hubfs/ShrinkLessGrowMore_1Pager-a02.pdf?hsLang=en).
- Olio is a community surplus-sharing app for giving away food and household items locally. Sources: [Olio availability/help](https://help.olioapp.com/article/11-where-is-olio-available), [Olio overview](https://en.wikipedia.org/wiki/Olio_%28app%29).

**Strengths**

- Clear sustainability story and strong emotional value.
- Local, mobile, and time-sensitive.
- Useful for bargain hunters willing to act quickly.

**Gaps GroceryView can fill**

- Surplus inventory is opportunistic and unreliable for normal weekly staples.
- It rarely supports comparable unit-price history, household budgeting, or planned basket optimization.
- It can distract from the proposal's core terminal wedge if pulled into MVP too early.

**Strategic response**

Keep "yellow sticker radar" as P2. In MVP, track normal shelf prices and promotions first; later, surplus can become a separate event type in product/store feeds.

## 7. White-space gaps GroceryView can own

### Gap 1: True deal validation for groceries

Existing apps show offers; few prove whether the offer is unusually good. GroceryView should score every deal using:

- Product's own price history.
- Current Stockholm percentile.
- Favorite-store percentile.
- Unit-price normalization.
- Multi-buy/member-price treatment.
- Equivalent-product and private-label alternatives.
- Source confidence.

**MVP expression:** Deal Score v1, 52-week low/high, historical percentile, current Stockholm percentile.

### Gap 2: TradingView-style grocery terminal

No competitor makes groceries feel like market instruments. GroceryView can own:

- Product ticker pages.
- Store pages.
- Category indices.
- Heatmaps.
- Top movers.
- 52-week lows.
- Watchlists.
- Alert panels.
- Confidence-marked charts.

**MVP expression:** Market Overview, Product Ticker Page, Watchlist, Store Deal Feed.

### Gap 3: Store-level Stockholm density

National apps may cover Sweden broadly; chain apps cover their own stores. GroceryView can win by being unusually dense and accurate for Stockholm neighborhoods.

**MVP expression:** Odenplan, Södermalm, Kungsholmen, Vasastan, Solna/Sundbyberg, Hammarby/Sickla, and other launch clusters with store-level pages and local indices.

### Gap 4: Cross-retailer household workflow

Bring! owns shared lists; chain apps own retailer lists; Matspar owns online basket comparison. GroceryView can combine:

- Household weekly basket.
- Shared watchlist.
- Weekly budget.
- Favorite stores.
- Split-by-store basket suggestions.
- Receipt-based budget reconciliation.

**MVP expression:** Weekly Basket + budget tracker + selected-store basket comparison.

### Gap 5: Receipt analytics as a data moat

Receipts close the loop between planned savings and actual spending. They also create community-verified price observations.

**MVP/P1 expression:** Start with manual receipt upload and Mathem/order imports if feasible; expand to chain digital receipts and OCR.

### Gap 6: Private-label and equivalent-product intelligence

Most comparison apps struggle with "same enough" products. GroceryView can support Swedish realities:

- ICA Basic vs Garant vs Coop Änglamark vs Lidl private labels.
- Exact SKU vs equivalent product vs acceptable substitute.
- Brand loyalty preferences.
- Nutrition-per-krona and eco/Swedish-origin filters.

**MVP expression:** Exact vs equivalent product display and basic private-label preference.

### Gap 7: Personal grocery inflation and market indices

Competitors show prices; few show a household's inflation or neighborhood/category indices.

**MVP/P1 expression:** Stockholm Grocery Index, product category indices, personal basket inflation, store price-level pages.

### Gap 8: Confidence, provenance, and verification

Grocery pricing is messy: member prices, local variants, out-of-stock items, temporary campaigns, delivery markups, and multi-buys. GroceryView should be explicit about data quality.

**MVP expression:** "verified observed," "retailer-published," "community-verified," "estimated," and "stale" badges.

---

## 8. Competitive positioning statement

Recommended positioning:

> **GroceryView is the Stockholm grocery market terminal: price history, real deal scores, watchlists, weekly baskets, and budget intelligence across the stores you actually use.**

Avoid positioning only as:

- A coupon app.
- A delivery app.
- A generic grocery list.
- A one-off basket comparison calculator.
- A nutrition scanner.

Better user-facing contrast:

- **Matpriskollen / Dayli / Matpris:** "Find offers."  
  **GroceryView:** "Know if the offer is truly good and whether it fits your basket."
- **Matspar / Nätmat / Matbit / PRISSPAR:** "Compare today's basket."  
  **GroceryView:** "Compare today's basket, history, alternatives, and budget impact."
- **Mathem / Wolt / foodora:** "Buy conveniently."  
  **GroceryView:** "Decide where and when to buy before you pay."
- **Keepa / PriceRunner / Prisjakt:** "Track e-commerce prices."  
  **GroceryView:** "Track grocery prices at local supermarkets like market data."
- **Yuka:** "Is this product healthy?"  
  **GroceryView:** "Is this product healthy enough, affordable now, and worth buying here?"
- **Bring!:** "Share the list."  
  **GroceryView:** "Share the list and make it price-aware."

---

## 9. Feature implications for the Stockholm MVP

### Must-have to be credible against local incumbents

1. Favorite stores and selected-area scope.
2. Weekly offers from major Stockholm chains.
3. Product search with unit-price normalization.
4. Basket comparison across selected stores.
5. Shopping list / weekly basket.
6. Watchlist and basic alerts.
7. Product page with current price, recent history, and store comparison.
8. Clear exact-vs-equivalent product handling.
9. Basic source confidence labels.

### Differentiators to prioritize early

1. Deal Score v1 with historical and Stockholm percentile inputs.
2. 52-week low/high and promotion markers.
3. Category and chain heatmaps for Stockholm.
4. Budget tracker tied to weekly basket.
5. Receipt scan/import roadmap, even if P1.
6. Private-label smart swaps.
7. SEO pages: product/store/category price pages for Stockholm.

### Features to defer unless they support the core wedge

1. Full travel-time optimization: proposal says do not penalize distance by default.
2. Full meal planning: useful, but only after price and basket intelligence are trustworthy.
3. Surplus/yellow-sticker radar: compelling P2, but not core MVP.
4. B2B dashboards/API: prove consumer data utility first.

---

## 10. Risks and defensive considerations

### Data access risk

Retailers may restrict scraping or alter APIs. Mitigations:

- Mix retailer-published data, user receipts, community verification, manual spot checks, and partnerships.
- Store provenance and confidence per observation.
- Avoid depending on one retailer or one data source.

### Incumbent response risk

Matpriskollen, Matspar, or chain apps could add history charts or richer budgets. Mitigations:

- Build a recognizable terminal UX and product vocabulary.
- Create retention through watchlists, alerts, receipt history, and household budget baselines.
- Launch high-density Stockholm store pages and indices that are hard to replicate quickly.

### Trust risk

If prices are wrong, users lose confidence quickly. Mitigations:

- Show last-updated timestamp.
- Separate verified vs estimated prices.
- Let users report/confirm price observations.
- Include caveats for member, multi-buy, and out-of-stock conditions.

### Complexity risk

A TradingView-style app can become overwhelming. Mitigations:

- Keep the default consumer view simple: "Buy now / OK / Wait / Switch."
- Hide advanced charts behind tabs.
- Let power users opt into terminal mode.

---

## 11. Recommended wedge

The sharpest initial wedge for Stockholm:

> **A price-aware weekly basket and watchlist for your favorite Stockholm stores, with Keepa-style price history and a true-deal score.**

Launch sequence:

1. Pick 50-100 high-frequency products across milk, eggs, butter, coffee, chicken, minced beef, pasta, rice, bread, cheese, bananas, tomatoes, potatoes, toilet paper, detergent, and diapers.
2. Track store-level prices and weekly offers for a dense Stockholm cluster.
3. Build product ticker pages and a Watchlist.
4. Add Weekly Basket comparison across selected favorite stores.
5. Add Deal Score v1 and "is this really cheap?" verdicts.
6. Add receipt upload/import to reconcile planned vs actual spend.
7. Expand product/store coverage after the first retention loop works.

Success depends on becoming the app users open before grocery shopping because it answers:

- What is cheap near me or at my chosen stores this week?
- Is this deal actually good?
- Should I buy now or wait?
- Which store or combination is best for my basket?
- Did I actually save money after shopping?

---

## 12. Source index

- GroceryView proposal: `PROPOSAL.md`
- Mathem: [Stockholm delivery](https://www.mathem.se/se/about/hemleverans-stockholm/), [how it works](https://www.mathem.se/se/about/handla-pa-mathem/), [app listing](https://play.google.com/store/apps/details?id=se.mathem.mathem), [Oda merger via Axfood](https://www.axfood.com/newsroom/news/mathem-is-merging-with-norwegian-oda/)
- Flipp: [homepage](https://app.flipp.com/)
- Proposal international references: [Trolley app](https://www.trolley.co.uk/app/), [Trolley price alerts](https://www.trolley.co.uk/CODE_RED_static_pages/price_alert.html), [Basket App Store](https://apps.apple.com/us/app/basket-grocery-shopping/id1060139875?l=uk), [FoodNavigator-USA Basket interview](https://www.foodnavigator-usa.com/Article/2019/01/04/Waze-for-groceries-Basket-app-deploys-crowdsourcing-for-real-time-pricing-info/), [Frugl](https://www.frugl.com.au/), [Frugl GPI ASX release](https://www.asx.com.au/asxpdf/20220720/pdf/45c0cqks129ml8.pdf), [kaufDA](https://www.kaufda.de/), [kaufDA App Store](https://apps.apple.com/de/app/kaufda-prospekte-angebote/id365527345), [Tokubai Google Play](https://play.google.com/store/apps/details?id=jp.co.tokubai.android.bargain), [Open Food Facts](https://world.openfoodfacts.org/), [AnyList](https://www.anylist.com/), [AnyList weekly shopping help](https://help.anylist.com/articles/weekly-shopping/), [Flashfood](https://flashfood.com/), [Flashfood help](https://help.flashfood.com/hc/en-us/articles/360049204914-What-is-Flashfood), [Flashfood retailer one-pager](https://hub.flashfood.com/hubfs/ShrinkLessGrowMore_1Pager-a02.pdf?hsLang=en), [Olio availability/help](https://help.olioapp.com/article/11-where-is-olio-available), [Olio overview](https://en.wikipedia.org/wiki/Olio_%28app%29)
- Keepa: [official site](https://keepa.com/), [Google Play listing](https://play.google.com/store/apps/details?id=com.keepa.mobile)
- Yuka: [app page](https://yuka.io/en/app), [App Store listing](https://apps.apple.com/us/app/yuka-food-cosmetic-scanner/id1092799236)
- Bring!: [collaborative lists](https://www.getbring.com/en/features/collaborative), [recipes](https://www.getbring.com/en/features/inspired)
- PriceRunner: [Sweden homepage](https://www.pricerunner.se/), [features](https://www.pricerunner.se/info/pricerunner-features), [about](https://www.pricerunner.se/info/about-pricerunner)
- Prisjakt / PriceSpy: [Prisjakt about](https://investors.prisjakt.nu/about-prisjakt/), [Prisjakt app](https://www.prisjakt.nu/tema/app), [PriceSpy mobile app](https://pricespy.co.uk/mobile-app--ecZXcBxBcAACUAeBbG), [PriceSpy price history](https://pricespy.co.uk/information/price-history), [SvD merchant-exit news](https://www.svd.se/a/5pEL91/cdon-och-jollyroom-rasar-mot-prisjakts-hoga-priser-hoppar-av)
- Matpriskollen: [app download/about](https://matpriskollen.se/ladda-ner-appen), [terms](https://matpriskollen.se/allmanna-villkor-matpriskollen), [Google Play](https://play.google.com/store/apps/details?hl=en-US&id=se.easyapp.matpriskollen), [articles](https://matpriskollen.se/aktuellt)
- Matspar: [about](https://www.matspar.se/om-oss)
- Nätmat / Natmat: [homepage](https://www.natmat.se/), [example product page](https://www.natmat.se/produkt/Kvarg-Naturell-0%2C3%25-101232098_ST)
- Matbit: [QuidBit case page](https://quidbit.se/food/)
- PRISSPAR: [homepage](https://www.prisspar.se/)
- Rezepta: [homepage](https://rezepta.app/en)
- Matmoms / Comparator / Matindex: [Matmoms](https://matmoms.se/), [Comparator grocery prices](https://comparator.se/en/grocery), [Matindex](https://www.matindex.se/), [Matindex Reddit discussion](https://www.reddit.com/r/sweden/comments/1ktklh0)
- Kvittovakten: [homepage](https://kvittovakten.se/), [Mathem category prices](https://kvittovakten.se/priser/kategori/mejeri-ost-juice)
- Dayli: [homepage](https://dayli.se/)
- Matpris: [App Store](https://apps.apple.com/se/app/matpris/id702243892)
- Veckans 200: [homepage](https://www.veckans200.se/)
- Fiffit: [homepage](https://www.fiffit.com/)
- Rabble: [homepage](https://www.rabble.se/)
- Stockholm local grocers: [Matdax](https://www.matdax.se/), [Matdax about](https://www.matdax.se/om-oss/), [Matdax VIP club](https://www.matdax.se/matdax-vip-klubb/), [Matvärlden](https://www.matvarlden.se/), [Rinkeby Matcenter](https://rinkebycentrum.se/butiker/rinkeby-matcenter), [Matcenter VIP club](https://www.matcenterfamiljen.se/matcenter-vip-klubb/), [Matöppet Mosebacke](https://www.matoppet.se/butik/mosebacke/), [r/stockholm grocery-cost discussion](https://www.reddit.com/r/stockholm/comments/1gby5vv), [r/TillSverige Stockholm grocery discussion](https://www.reddit.com/r/TillSverige/comments/13grwy4)
- Chain apps: [ICA](https://www.ica.se/appar-och-tjanster/appen-ica/), [Coop App Store](https://apps.apple.com/se/app/coop-mat-erbjudanden-medlem/id408840395), [Willys](https://www.willys.se/artikel/om-willys-appen), [Hemköp](https://www.hemkop.se/artikel/mobilapp), [Lidl Plus](https://www.lidl.se/c/lidl-plus/s10017033), [City Gross Google Play](https://play.google.com/store/apps/details?hl=sv&id=se.radx.citygross)
- Delivery apps: [Wolt Market Sweden](https://explore.wolt.com/en/swe/wolt-market), [Wolt Market Stockholm](https://wolt.com/en/swe/stockholm/venue/wolt-market-stockholm-city), [Wolt Stockholm](https://wolt.com/en/nor/stockholm), [foodora Sweden](https://www.foodora.se/en/contents/app), [Picsmart](https://picsmart.se/)
- Surplus: [Karma via Visit Stockholm](https://www.visitstockholm.com/o/karma/), [Too Good To Go overview](https://en.wikipedia.org/wiki/Too_Good_To_Go), [Too Good To Go surplus app description](https://www.prnewswire.com/news-releases/on-demand-grocery-delivery-apps-go-zero-waste-with-too-good-to-go-301466970.html), [Matsmart/Motatos company page](https://people.matsmart.se/), [Matsmart Google Play](https://play.google.com/store/apps/details?id=com.matsmart.app)
- Emerging apps: [Smaklig](https://smaklig.app/en), [SmartaMenyn](https://www.smartamenyn.se/), [Veckomat](https://veckomat.com/), [Matdags](https://www.matdags.se/), [Matdags Google Play](https://play.google.com/store/apps/details?id=com.matdags.matdagsandroid), [GroceryGlow App Store](https://apps.apple.com/se/app/groceryglow/id6758956139), [GroceryPlus App Store](https://apps.apple.com/se/app/groceryplus/id6757016060)
- Market context: [SCB 2025 food prices](https://www.scb.se/pressmeddelande/matpriserna-steg-under-2025/?menu=open), [SCB April 2026 food-price CPI](https://www.scb.se/pressmeddelande/matpriserna-sjonk-i-april2/), [Skatteverket food VAT 2026](https://www.skatteverket.se/omoss/pressochmedia/nyheter/2026/nyheter/livsmedelsmomsensankstill6procent.5.70685bee19c85dd5dd0a3f.html), [Konsumentverket monitoring assignment](https://www.konsumentverket.se/uppdrag-matmoms/), [Konkurrensverket grocery review](https://www.konkurrensverket.se/informationsmaterial/rapportlista/konkurrensverkets-genomlysning-av-livsmedelsbranschen-20232024/), [Konkurrensverket English summary PDF](https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/rapportserie/rapport_2024-5_summary.pdf)
