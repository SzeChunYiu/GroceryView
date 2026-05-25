# MyFlyer Architecture

`MyFlyer` is GroceryView's per-user flyer digest. It is server-rendered so every delivery surface starts from the same source-backed promotion set, the same user signals, and the same ranking explanation.

## Product Contract

`/my-flyer` renders a personalized digest that combines active promotions across all supported chains before ranking them for one shopper. It is not a chain flyer clone and it is not a static weekly page. The digest starts from verified promotion evidence, normalizes each offer into comparable shopper-facing values, then orders the result with the user's selected ranking strategy.

The server owns the digest assembly:

1. Load active promotion rows for the request time.
2. Join product, chain, store, category, source-run, and provenance metadata.
3. Normalize offer economics, including regular price, offer price, savings, discount percentage, membership requirement, validity window, and effective unit price.
4. Apply eligibility filters from user preferences.
5. Rank eligible offers with the user's chosen ranker or ranker composition.
6. Render the web route and persist the same digest snapshot for opt-in delivery surfaces.

Every digest item must keep the source chain, store or region, source run, validity window, confidence, and source URL visible to downstream renderers. Member-only prices remain explicitly labeled and must not overwrite shelf-price history.

## Promotion Source

The canonical source is the promotion evidence already modeled by GroceryView:

- `db/schema.sql` defines `promotion_observations` for legacy promotion storage with `product_id`, `chain_id`, optional `store_id`, `promo_start`, `promo_end`, `promo_price`, `regular_price_claimed`, `promo_text`, `member_only`, multi-buy fields, `source_type`, and `confidence_score`.
- Runtime flyer APIs currently read `observations` rows with `price_type in ('promotion', 'member')`, non-null `regular_price`, active validity bounds, product metadata, chain metadata, store metadata, confidence, and provenance in `packages/server/src/index.ts`.
- `packages/api/src/index.ts` maps those rows through `buildFlyerOfferReport`, preserving active-window checks and guardrails for flyer offers.

`MyFlyer` should treat those existing flyer offer rows as the input contract rather than introducing a separate promotion store. If future ingestion keeps writing into `promotion_observations`, a repository adapter should translate that table into the same flyer-offer input shape before ranking.

## Effective Unit Price

Ranking and rendering should prefer effective unit price when package-size evidence exists. The helper contract is:

```ts
type EffectiveUnitPriceInput = {
  offerPrice: number;
  packageQuantity: number;
  packageUnit: 'kg' | 'g' | 'l' | 'ml' | 'st';
  multiBuyQuantity?: number;
  multiBuyPrice?: number;
  memberRequired?: boolean;
};

type EffectiveUnitPrice = {
  amount: number;
  unit: 'kg' | 'l' | 'st';
  basis: 'single_pack' | 'multi_buy' | 'member_multi_buy';
};
```

The helper uses the promotional payable amount first: `multiBuyPrice / totalComparableQuantity` when a multi-buy applies, otherwise `offerPrice / comparableQuantity`. It returns no value when package quantity, package unit, or price evidence is missing or non-positive. This keeps `MyFlyer` from fabricating unit prices for products that cannot be compared.

## User Signals

The digest ranking context is assembled from these user signals:

| Signal | Use in MyFlyer |
| --- | --- |
| Favorite stores | Boost or filter offers tied to stores the shopper saved. Store-level evidence wins over chain-level evidence when both exist. |
| Geolocation | Score nearby stores and suppress offers outside the shopper's configured radius when the selected ranker requires proximity. |
| Watchlist | Boost watched products, brands, categories, and allowed price types. Watchlist matches should explain the exact matched product or category. |
| Recent basket | Boost products recently bought or planned, including close canonical-product matches when confidence clears the matching threshold. |
| Diet filters | Exclude or down-rank offers that conflict with saved diet, allergen, or household restrictions. Filtered rows should be counted for transparency, not silently mixed into the ranked list. |
| Household size | Adjust quantity-sensitive scoring, especially multi-buy offers, bulk packs, and expiry-sensitive categories. Larger households can score bulk savings higher; smaller households should not be pushed toward wasteful quantities. |

Signals are read-only ranking inputs. They must not change the underlying promotion observation or the stored regular price.

## Ranking

Ranking is pluggable. A user can select one ranker or compose a weighted ranking from compatible rankers. The current `composeWeightedRankers` helper in `packages/core/src/lib/rankers/compose.ts` already supports two to three rankers with normalized weighted scores and deterministic ranks, so `MyFlyer` should reuse that pattern.

Initial ranker candidates:

| Ranker | Primary score |
| --- | --- |
| `best_savings` | Absolute SEK savings versus regular price. |
| `best_unit_price` | Lowest effective unit price among comparable package units. |
| `nearby` | Savings discounted by distance from the shopper, following the documented nearby ranker. |
| `watchlist_first` | Watchlist and recent-basket matches before general offers. |
| `household_fit` | Quantity and cadence fit for the household size. |
| `diet_safe` | Eligibility and diet compatibility before savings. |

Single-ranker mode sorts by the selected ranker's score plus stable tie breakers: higher confidence, earlier expiry, chain, store, product name, and observation id. Composed mode records each ranker's contribution so the UI can explain why an offer appears above another offer.

Rankers must fail closed. Missing distance excludes proximity scoring, missing package data excludes unit-price scoring, and missing dietary metadata cannot be treated as safe for a strict diet filter.

## Delivery Surfaces

All delivery surfaces consume one server-rendered digest snapshot:

| Surface | Contract |
| --- | --- |
| Web `/my-flyer` | Primary authenticated route with full ranking controls, filters, and explanations. |
| Opt-in email | Scheduled digest using the same ranked rows, unsubscribe controls, and quiet-hours policy. |
| PWA push | Short alert for newly relevant top offers, capped by notification preferences. |
| Print | Printer-friendly layout grouped by store and category. |
| PDF | Frozen, shareable rendering of the same digest snapshot with generated timestamp and source caveats. |
| Share link | Permission-scoped digest link that preserves source labels while avoiding private preference leakage. |

Email, push, PDF, print, and share links should reference the digest snapshot id rather than re-ranking in the delivery job. This keeps all surfaces consistent with the web view the user saw.

## Guardrails

- Only active promotions within their validity window can enter the digest.
- Promotions without source provenance, confidence, or chain metadata are excluded.
- Member, loyalty, estimated, low-confidence, and store-specific offers stay labeled before customer action.
- Effective unit price is shown only when computed from observed price and package evidence.
- Ranking explanations cite ranker ids and signal contributions, not private raw user history.
- Sponsored placement must remain separate from organic ranking if ad inventory is ever introduced.
