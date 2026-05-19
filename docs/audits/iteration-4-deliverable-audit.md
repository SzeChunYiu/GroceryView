# Iteration 4 Deliverable Audit

## Objective restatement

Continue completing GroceryView deliverables iteratively, with concrete artifacts, verification, PR, and merge to `main` after each iteration.

## Iteration 4 shipped scope

| Proposal data requirement | Artifact evidence | Status |
| --- | --- | --- |
| Store table | `db/schema.sql` `stores` | Shipped schema |
| Product catalog | `products`, `categories`, `product_aliases` | Shipped schema |
| Price observations as events | `price_observations` with `observed_at`, source, confidence | Shipped schema |
| Promotion observations | `promotion_observations` | Shipped schema |
| User preferences | `user_preferences` with budgets/private-label/member-price settings | Shipped schema |
| Favorite stores/watchlist/basket/budget | `favorite_stores`, `watchlist_items`, `weekly_baskets`, `basket_items`, `budgets` | Shipped schema |
| Receipt/community verification | `receipt_uploads`, `receipt_items`, `community_price_reports` | Shipped schema |
| Grocery indices | `grocery_indices`, `grocery_index_components` | Shipped schema |
| Schema coverage verification | `tests/schema/schema.test.mjs` included in root `npm test` | Verified |
| PR and merge after iteration | GitHub PR evidence to be added after merge | Pending until PR step |

## Verification commands

- `npm test`
- `npm run build`
- `npm run typecheck`

## Remaining gaps

Schema is not yet applied through migrations to a live Postgres database. Backend persistence adapters, auth, seed importers, ingestion workers, and deployment remain open.
