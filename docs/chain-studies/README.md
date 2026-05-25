# Chain study comparison matrix

Status: operator gap summary for GroceryView chain studies.  
Ticket: factory-tickets #1563.  
Last updated: 2026-05-25.

This index aggregates the checked-in chain-study notes and highlights which
pricing/model dimensions have verified evidence. `Yes` means the study documents
a source-backed behaviour. `No` means the study explicitly found no verified
behaviour. `Partial` means the behaviour exists but is limited to a subset of
rows or needs account/app context before GroceryView can model it safely.

| Study / chain | has_online? | has_loyalty? | has_format_variance? | has_region_pricing? | has_subscription? | has_app_coupons? | has_counter_pricing? | Primary gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Willys SE](./willys.md) | Yes | Yes | Partial | Partial | No | Partial | No | Store-scoped campaign rows are modeled, but no public regional price rule or counter split is verified. |
| [Goodstore SE](./goodstore-se.md) | Yes | Yes | No | No | No | Yes | No | Single-store webshop; Goodfriends online discount uses personal codes and should remain eligibility/coupon context. |
| [Pharmacy cross-chain savings](./cross-chain-savings.md) | Yes | Partial | No | No | No | Partial | No | Exact-EAN comparison exists for Apohem/Apotek Hjärtat only; DocMorris/Apoteket.se need production observation rows. |
| [Loyalty programs](./loyalty-programs.md) | Partial | Yes | Partial | No | No | Yes | No | Enrollment/data tradeoffs are documented, but loyalty prices must stay account-bound until shopper enables membership. |
| [Iceland fuel](./iceland-fuel.md) | Yes | No | No | Yes | No | No | No | Fuel observations are intentionally separate from grocery baskets; extend only through fuel-domain connectors. |

## Column definitions

- `has_online?`: study verifies online ordering, online prices, or online-only channel behavior.
- `has_loyalty?`: study verifies a loyalty/member price, point, or discount program.
- `has_format_variance?`: study verifies a store-format/sub-brand distinction worth preserving.
- `has_region_pricing?`: study verifies store, city, region, or cluster-scoped pricing evidence.
- `has_subscription?`: study verifies a paid subscription that changes product prices.
- `has_app_coupons?`: study verifies app-only, coupon-code, or personal-offer mechanics.
- `has_counter_pricing?`: study verifies service-counter/café/manual counter prices separate from packaged shelf rows.

## Operator use

1. Prioritize connector fields for `Yes` and `Partial` columns before adding new model assumptions.
2. Keep `No` columns explicit in downstream copy so the app does not invent price gaps.
3. Revisit this README whenever a new `docs/chain-studies/*.md` file lands.
