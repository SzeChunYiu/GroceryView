# Navigation card-sort study

Synthetic study date: 2026-05-24. Method: 10 grocery-shopping personas each sorted 30 current/near-current GroceryView navigation cards into self-named groups, then flagged any card name that felt ambiguous.

## Cards tested

Products, Categories, Stores, Map, Compare, Catalogue savings, Chain index, Chain coverage, Store coverage, Data sources, OpenPrices depth, Settings, Favorites, List, Scanner, Household, Coupons, Price reports, Shopping trips, Privacy, Account profile, Login, Pharmacy, Cheapest pages, Prisjämförelse, Stockholm cheapest pages, Product detail, Store detail, Category detail, Favorites/watchlist hearts.

## Personas

1. Budget parent planning a weekly shop.
2. Student comparing cheapest staples.
3. Newcomer looking for familiar brands and pictures.
4. Deal hunter watching price drops.
5. Accessibility-focused shopper using short sessions.
6. Privacy-conscious user checking data sources.
7. Household coordinator managing shared lists.
8. Pharmacy/OTC shopper.
9. Local commuter choosing nearby stores.
10. Power user validating GroceryView data quality.

## Aggregate groups users created

| Mental-model group | Cards most often placed here | Personas using group |
| --- | --- | --- |
| Shop and browse | Products, Categories, Product detail, Category detail, Pharmacy | 10/10 |
| Compare prices | Compare, Catalogue savings, Chain index, Prisjämförelse, Cheapest pages, Stockholm cheapest pages | 9/10 |
| Nearby stores | Stores, Store detail, Map, Store coverage, Chain coverage | 9/10 |
| My planning | List, Favorites, Favorites/watchlist hearts, Household, Shopping trips, Coupons | 8/10 |
| Scan and report | Scanner, Price reports | 7/10 |
| Trust and data | Data sources, OpenPrices depth, Privacy | 8/10 |
| Account and settings | Login, Account profile, Settings | 10/10 |

## Items that did not fit users' mental models

- **Catalogue savings** split between Compare prices and Shop and browse. Users expected plain language such as “Savings guide.”
- **Chain index** and **Chain coverage** were confused. Participants treated “index” as price ranking and “coverage” as data-quality evidence, but could not predict which page answered “which chain is cheapest?”
- **Store coverage** was grouped with Nearby stores by local shoppers and Trust/data by power users. The label needs a data-quality qualifier.
- **OpenPrices depth** was only clear to power users. Most users expected it under Trust/data but wanted a short explanation.
- **Cheapest pages**, **Prisjämförelse**, and **Stockholm cheapest pages** felt like SEO duplicates. Users wanted one “Cheapest by product/location” entry.
- **Favorites/watchlist hearts** overlapped with Favorites. Users saw the heart action as a feature inside Favorites, not separate navigation.
- **Price reports** grouped with Scanner, not My planning. Users understood it as contributing data rather than managing a trip.
- **Shopping trips** grouped with List and Household, but users wanted the label “Trips” or “Trip planner.”

## Proposed restructure

### Primary nav

1. **Shop**
   - Products
   - Categories
   - Pharmacy
   - Product detail and Category detail remain contextual, not top-level.
2. **Compare**
   - Compare
   - Savings guide (rename Catalogue savings)
   - Chain price index (rename Chain index)
   - Cheapest by product/location (consolidate Cheapest pages, Prisjämförelse, Stockholm cheapest pages)
3. **Stores near me**
   - Stores
   - Map
   - Store detail remains contextual.
4. **My list**
   - List
   - Favorites
   - Household
   - Trips (rename Shopping trips)
   - Coupons
5. **Contribute**
   - Scanner
   - Price reports
6. **Data & trust**
   - Data sources
   - Data coverage (combine Chain coverage and Store coverage entry points with tabs)
   - OpenPrices depth
   - Privacy
7. **Account**
   - Login
   - Account profile
   - Settings

### Label changes

- Catalogue savings → **Savings guide**
- Chain index → **Chain price index**
- Chain coverage / Store coverage → **Data coverage** with chain/store tabs
- Shopping trips → **Trips**
- Price reports → **Report prices**
- OpenPrices depth → **OpenPrices data depth**

## Recommended IA changes

1. Collapse SEO landing links into one Compare sub-entry and expose city/product variants on that page.
2. Keep detail pages out of primary nav; surface them through cards, breadcrumbs, and search.
3. Put Favorites/watchlist hearts inside Favorites instead of a separate nav card.
4. Split “plan my own shopping” from “contribute data” so Scanner and Price reports do not sit beside Household/List.
5. Add one-sentence helper text under technical labels in desktop mega-nav and mobile drawer.
6. Use Data & trust as the home for source, coverage, privacy, and OpenPrices quality pages.
