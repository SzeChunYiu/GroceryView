# Global grocery and cross-domain feature benchmark

Date: 2026-05-22

Purpose: turn worldwide grocery, shopping, travel, and marketplace patterns into a practical feature map for making GroceryView the best possible Swedish grocery discovery, comparison, and shopping-planning site.

## Executive recommendation

GroceryView should become a **trusted grocery decision engine**, not just a price table. The winning product combines four layers:

1. **Truth layer:** daily, source-backed price, offer, unit-price, loyalty-price, stock/coverage, and freshness signals.
2. **Decision layer:** full-basket optimization, price history, alerts, substitutions, travel-cost/delivery-fee inclusion, and confidence labels.
3. **Habit layer:** saved favourites, recurring baskets, receipt import, pantry/recipe planning, personalized dietary filters, and store preferences.
4. **Action layer:** retailer deep links, basket transfer where possible, pickup/delivery slot awareness, shareable lists, and an explicit roadmap toward account-bound checkout handoff.

The immediate differentiator for Sweden should be: **"I can enter my normal weekly basket once and GroceryView tells me where to buy it today, what changed since last week, what I can substitute, and how reliable the answer is."**

## Benchmarked sites and transferable lessons

| Domain | Site / product | Observed strong features | Lesson for GroceryView |
| --- | --- | --- | --- |
| Grocery price comparison | Trolley.co.uk | Compares 16+ UK supermarkets; saveable lists; barcode scanning; supermarket list comparison; price history; price alerts; daily deals; lists grouped by store. Source: <https://www.trolley.co.uk/app/> | Build around lists and alerts, not one-off searches. Let users shop at the till, at home, or while planning. |
| Grocery price comparison | Basketr | Public stats for products, stores, offers, price drops, and last-updated date; daily crawling; loyalty price visibility; basket comparison; receipt scanner; categories; favourites; alerts; scan history; loyalty card toggles; data export/delete. Source: <https://basketr.app/> | Expose data freshness and coverage in the UI. Treat privacy, account sync, and user data export/delete as product features. |
| Grocery price comparison | HelloSupermarket | Large catalogue, direct basket transfer positioning, price sorting, favourites, offers, unit prices. Source: <https://hellosupermarket.co.uk/> | Basket transfer is a high-value action layer, but requires transparent retailer support and fallback when transfer is unavailable. |
| Grocery price comparison | PriceTillt | Simple three-step onboarding: search/scan, build basket, compare full basket; front-and-center cheapest basket and savings delta. Source: <https://www.pricetillt.com/> | The first screen should make the user understand the product in seconds: build basket -> see cheapest store -> see savings. |
| Grocery personalization | Instacart Smart Shop | AI personalization from purchases/searches, dietary preference understanding, health tags, recommendations that learn over time. Source: <https://www.instacart.com/company/updates/introducing-smart-shop-personalization> | GroceryView can personalize without guessing too much: start with explicit dietary/lifestyle filters, then learn from favourites and baskets. |
| Grocery fulfillment | Ocado Reserved | Recurring delivery slot and suggested order based on usual purchases, with edit window before delivery. Source: <https://help.ocado.com/hc/en-us/articles/360019290118-What-is-Ocado-Reserved> | Add recurring basket templates: "my weekly basics", "monthly household", "kids lunchbox", with automated change summaries. |
| General shopping | Google Shopping | Deals tab, multi-retailer price comparison, price insights, retailer-specific price history, price-drop tracking. Source: <https://blog.google/products-and-platforms/products/shopping/save-money-price-insights-price-alerts/> | Add price context, not only current price: high/typical/low, price trend, and alert thresholds. |
| Browser shopping | Microsoft Edge Shopping | Price comparison, price history, price tracking, cashback surfaced while users are already on retailer pages. Source: <https://www.microsoft.com/en-us/edge/features/price-tracking> | A future browser extension/bookmarklet could compare ICA/Willys/Coop pages in-place and import baskets. |
| Travel price discovery | KAYAK | Flexible date search, price graph, explore map, nearby alternatives, price alerts, filters by budget/stops/duration. Source: <https://www.kayak.com/c/help/search/> | Grocery equivalent: flexible store radius, delivery/pickup windows, budget bands, "show cheaper alternatives within 2 km / 5 km / delivery". |
| Travel marketplace | Airbnb | Flexible search, monthly-stay search, wishlists, filters, ranking that helps users find the right listing. Source: <https://www.airbnb.com/help/article/252> | Add shareable grocery wishlists and scenario filters: vegan, gluten-free, baby, bulk, Swedish staples, quick meals. |
| Travel marketplace | Booking.com Genius | Account-gated loyalty, permanent levels, automatic discounts, price alerts, clear badge labels. Source: <https://www.booking.com/genius.en-gb.html> | If GroceryView adds monetization or pro features, benefits should be automatic and visibly applied, not coupon-code based. |
| User-reported needs | Frugal/reddit grocery discussions | Users repeatedly ask for full-basket comparison, receipt upload, real current shelf prices, local radius, delivery fees, and store-distance/petrol cost inclusion. Sources: <https://www.reddit.com/r/AussieFrugal/comments/1fe51o2>, <https://www.reddit.com/r/AskZA/comments/1r36nmg/would_a_grocery_compare_app_be_beneficial/> | Optimize for total trip cost: basket total + delivery fee + travel cost + time + substitution risk. |

## Feature principles for the perfect GroceryView

### 1. Make trust visible

Users will not trust price comparison unless they understand freshness, coverage, and uncertainty.

Required UX:

- Show `last updated` per product/store price and per basket total.
- Show source labels: retailer API/page, flyer, receipt/community contribution, Open Food Facts, or manual review.
- Show confidence labels for product matching: exact barcode, same SKU, likely equivalent, or suggested substitute.
- Show coverage gaps explicitly: "Coop missing online price for this SKU" is better than silently omitting Coop.
- Show online-vs-store caveats and loyalty-price caveats before checkout.

### 2. Compare baskets, not isolated products

One cheap product rarely determines the best weekly shop. The core loop should be:

1. Search, scan, import receipt, or paste a shopping list.
2. Normalize product intent into exact products plus acceptable substitutes.
3. Compare full basket totals by store, including offers and loyalty prices.
4. Show savings deltas, missing items, substitution options, and confidence.
5. Let the user save, share, or open retailer deep links.

MVP acceptance target: a user can build a 20-item basket and see ranked totals across ICA, Willys, Coop, Hemköp, Lidl, and City Gross with a clear explanation for unavailable items.

### 3. Use price intelligence as the retention loop

Borrow from Trolley, Basketr, Google Shopping, KAYAK, and Booking.com:

- Price alerts with thresholds, not just any drop.
- "Buy now / wait" signals from 30/90-day price history.
- Weekly savings digest for favourites and recurring baskets.
- Offer expiry reminders and "deal starts tomorrow" notices when flyer data allows.
- Price-history charts at product and basket levels.
- A saved alert center with controls for email, push, and quiet hours.

### 4. Add Swedish-specific context

Sweden has dense urban grocery networks and strong loyalty ecosystems. GroceryView should support:

- Chain coverage: ICA, Willys, Coop, Hemköp, Lidl, City Gross first; extensible targets for Mathem/Matspar/Matpriskollen and local stores.
- Loyalty price toggles per chain, with account-safe storage of user preferences but no retailer credentials unless a secure integration exists.
- Unit pricing across SEK/kg, SEK/litre, SEK/st, SEK/portion.
- Store distance, travel mode, and delivery/pickup availability when available.
- Swedish dietary and household filters: laktosfri, glutenfri, ekologisk, KRAV, halal, vegan, barnfamilj, student, bulk.

### 5. Turn repeated shopping into one-tap planning

From Ocado Reserved and grocery list apps:

- Recurring baskets: weekly basics, monthly cleaning, party, school lunch, pet.
- "Changed since last shop" cards: price up/down, no longer on offer, better substitute, item missing.
- Receipt import to bootstrap a recurring basket and estimate missed savings.
- Pantry mode: mark items already at home so recipe/list generation does not overbuy.
- Collaborative household lists with role-based permissions.

### 6. Make action easy while staying honest

Deep links and basket transfer should be available where reliable, but GroceryView must never pretend checkout happened unless retailer confirmation exists.

Action layers:

- Retailer product deep links for each item.
- Store-specific grouped shopping lists.
- Copy/export list for retailer app search.
- Bookmarklet/browser extension research for importing baskets from retailer pages.
- Direct basket transfer only with a support matrix and post-transfer verification.
- For future checkout monetization: account-bound intent creation, visible retailer handoff, and post-handoff status audit.

## Prioritized roadmap

### Now: foundation and discoverability

1. Public comparison page with strong first-run narrative: search/scan/import -> compare basket -> save money.
2. Data freshness and coverage chips on every price and basket.
3. Full-basket comparison with missing-item explanations.
4. Unit-price sorting and offer/loyalty-price display.
5. Saved baskets and favourites tied to logged-in accounts.
6. Research-backed feature matrix linked from product planning docs.

### Next: retention and habit

1. Price alerts with custom thresholds.
2. Product and basket price history.
3. Receipt scanner/import pipeline with privacy language.
4. Weekly digest for favourites and recurring baskets.
5. "Changed since last shop" summaries.
6. Shareable household lists.

### Later: best-in-class action layer

1. Retailer deep-link quality scoring.
2. Browser extension/bookmarklet to import/export retailer baskets.
3. Delivery/pickup fee and travel-cost optimizer.
4. AI dietary preference and substitution assistant.
5. Secure retailer basket transfer where permitted.
6. Pro/loyalty layer with automatic benefits and transparent data export/delete.

## Metrics that prove the features are better

| Metric | Why it matters |
| --- | --- |
| Basket completion rate | Shows users can build a real shop, not just search. |
| Stores compared per basket | Proves broad chain coverage is being used. |
| Missing-item explanation rate | Measures trust and gap transparency. |
| Alert-to-return rate | Measures retention loop. |
| Receipt-import-to-saved-basket conversion | Measures habit creation. |
| Price freshness SLA by chain | Keeps comparison credible. |
| Median estimated savings per basket | Direct user value. |
| Deep-link success rate | Measures whether action layer is reliable. |

## Open questions for future research

1. Which Swedish retailers permit reliable product deep links, basket links, or affiliate links?
2. Which flyer/promotion sources can provide offer start/end dates consistently?
3. Can barcode and Open Food Facts coverage support Swedish private-label matching at scale?
4. What privacy constraints apply to receipt OCR and household list sharing under GDPR?
5. Which city/store-density assumptions best model travel cost for Swedish users?

## Source notes

This document intentionally includes both direct competitor examples and cross-domain patterns because the target is not "another price table". The target is a complete grocery decision experience: confidence, comparison, alerts, recurring behavior, personalization, and action.
