# First-click test: persona × task

Date: 2026-05-24  
Method: heuristic first-click review of current GroceryView navigation labels, page headings, and primary CTAs. Intent is to flag likely first clicks before moderated testing.

## Personas

- **Budget-conscious shopper**: wants the cheapest acceptable weekly basket.
- **Family planner**: plans meals and lunchbox staples for a household.
- **Student / young single**: wants fast, low-effort deals and simple recipes.
- **Elderly / fixed income**: prioritises predictable staples, nearby stores, and readability.
- **Deal hunter / foodie**: browses promotions and new interesting offers.
- **Health & fitness shopper**: optimises protein, macros, and nutrition per krona.

## First-click matrix

| Task | Designer-intended first click | Budget-conscious | Family planner | Student | Elderly / fixed income | Deal hunter / foodie | Health & fitness | Result |
|---|---|---|---|---|---|---|---|---|
| Compare a weekly basket across stores | **Weekly basket** | Weekly basket | Weekly basket | Basket ideas | Shopping trips | Deals | Nutrition value | Mixed |
| Find the cheapest store route for today | **Shopping trips** | Weekly basket | Shopping trips | Deals | Shopping trips | Deals | Shopping trips | Mostly aligned |
| Build meals from discounted items | **Meal planner** | Deals | Meal planner | Meal planner | Weekly basket | Deals | Meal planner | Mixed |
| Track price drops on staples | **Watchlist** | Watchlist | Watchlist | Deals | Savings dashboard | Watchlist | Watchlist | Mostly aligned |
| Understand personal grocery inflation | **Savings dashboard** | Savings dashboard | Weekly basket | Deals | Savings dashboard | Price reports | Savings dashboard | Mixed |
| Find high-protein value products | **Nutrition value** | Nutrition value | Meal planner | Nutrition value | Categories | Deals | Nutrition value | Mostly aligned |
| Check expiry markdowns nearby | **Deals → Expiry deals radar** | Deals | Deals | Deals | Shopping trips | Deals | Deals | Mostly aligned |
| Import or share a shopping list | **Shopping list** | Weekly basket | Shopping list | Shopping list | Shopping trips | Deals | Shopping list | Mixed |

## Misalignments and friction tickets

| Friction ticket | Evidence from first clicks | Suggested fix |
|---|---|---|
| `UX-FT-001: Clarify Weekly basket vs Basket ideas` | Students and deal hunters are likely to click **Basket ideas** or **Deals** before the intended basket comparison path. | Add a secondary label under Weekly basket: “compare your list across stores”. |
| `UX-FT-002: Surface meal planning from Deals` | Budget shoppers and deal hunters start from **Deals** for discounted-meal tasks. | Add a “Plan meals from these deals” CTA on Deals cards. |
| `UX-FT-003: Connect Shopping trips to shared list` | Elderly users may start at **Shopping trips** for list/share because the task sounds like a trip-planning action. | Add “Open or share shopping list” in Shopping trips route summary. |
| `UX-FT-004: Make price history vs personal inflation clearer` | Deal hunters may pick **Price reports** for personal inflation, but intended path is **Savings dashboard**. | Rename or annotate Savings dashboard as “Your grocery inflation”. |
| `UX-FT-005: Add health shortcut from Deals` | Health shoppers can use **Nutrition value**, but deal hunters looking for protein deals may remain on **Deals**. | Add filter chip “protein value” linking Deals to Nutrition value. |

## Summary

Strongest labels: **Watchlist**, **Shopping trips**, **Nutrition value**, and **Deals**. Weakest label boundary: basket comparison vs ideas vs list sharing. The next UX iteration should add cross-links rather than rename everything, because most misclicks land on adjacent surfaces with relevant context.
