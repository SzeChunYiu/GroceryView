# MyFlyer architecture

MyFlyer is the per-user weekly flyer for GroceryView. It is a **server-rendered digest** that combines active promotions from every supported grocery chain, ranks them with user-approved signals, and delivers the same explainable offer set across web, email, push, print, PDF, and share surfaces.

## Product definition

- **Digest scope:** MyFlyer starts from all active chain promotions that the ingestion pipeline has normalized into GroceryView price observations. It is not a client-side scraper and it must not invent offers that are absent from source evidence.
- **Personalization:** each request builds a user-specific ranked set from promotion facts plus user signals. The default route is `/my-flyer`; city-specific or localized shells may mount the same server-rendered experience under paths such as `/:city/my-flyer`.
- **Server rendering:** ranking, offer filtering, disclosure text, and printable markup are produced server-side so web, email, PDF, print, and share-link output cannot diverge.
- **Explainability:** every rendered card should show why it appeared, the source chain/store, validity dates, member-only requirements, and the fields used to calculate savings or unit-price comparisons.

## Promotion source of truth

MyFlyer reads the promotion table as the logical promotion view backed by the grocery price schema:

- `infra/db/SCHEMA.md` defines immutable `observations` with `price_type = 'promotion'` or `price_type = 'member'`, `price`, `regular_price`, `unit_price`, `currency`, `quantity`, `quantity_unit`, `promotion_text`, `promotion_starts_on`, `promotion_ends_on`, `member_required`, `observed_at`, `valid_from`, `valid_until`, `confidence`, and `provenance`.
- `latest_prices` is the hot read snapshot for the current winning observation per product/chain/store/price type. MyFlyer may use it for active-offer reads when it joins back to `observations` for promotion text, validity, member flags, and provenance.
- Existing flyer APIs (`/api/deals/flyer-offers`, `/api/stores/{id}/flyer-offers`, and API-app equivalents) are the public promotion feed boundary. MyFlyer can consume those providers or a first-party query with the same contract.

Active promotion eligibility:

1. `domain = 'grocery'`.
2. `price_type in ('promotion', 'member')`.
3. `is_available = true`.
4. `confidence` meets the MyFlyer minimum.
5. `asOf` falls within `valid_from`/`valid_until` when present, otherwise within `promotion_starts_on`/`promotion_ends_on` when present.
6. Expired or future promotions are excluded unless a surface explicitly labels them as preview or expired history.

## `effective_unit_price` helper

Ranking and comparisons use a shared `effective_unit_price(offer)` helper before any algorithm runs.

Contract:

- Prefer the normalized `unit_price` from the promotion observation when it is present, positive, and tied to a known comparable unit.
- Otherwise derive `price / quantity` only when `quantity` and `quantity_unit` are source-backed and compatible with the product's comparable unit.
- Return `null` when the comparable unit is missing, ambiguous, multi-buy-only, or requires assumptions; never infer package sizes from product names.
- Preserve `currency` and comparable unit in the return value so algorithms never compare SEK/kg with SEK/litre or each-price rows.
- Emit an explanation code such as `normalized_unit_price`, `derived_from_quantity`, `multi_buy_not_comparable`, or `missing_quantity` for UI disclosure and ranking diagnostics.

Savings fields are optional. When `regular_price` is available and greater than `price`, MyFlyer may compute absolute and percentage savings, but discount depth is only one ranking feature and must not replace unit-price evidence.

## User signals

Signals are loaded on the server for the signed-in user and are individually gateable. Missing signals reduce personalization instead of failing the digest.

| Signal | Meaning | Ranking use | Guardrail |
| --- | --- | --- | --- |
| Favorite stores | Explicit stores/chains the user prefers. | Boost offers from those stores and nearby sibling stores; group cards by preferred chain when useful. | Do not show a favorite-store explanation unless the user explicitly saved that store. |
| Geolocation | Current location, saved home area, or chosen city. | Penalize far-away stores, prefer pickup/delivery coverage, and choose local flyer variants. | Requires permission or saved location; coarse city fallback is acceptable. |
| Watchlist | Products, brands, categories, or allowed price types the user tracks. | Strongly boost exact products and close substitutes; trigger watchlist sections. | Respect hidden products/stores and allowed price types. |
| Recent basket | Recently added or purchased grocery items. | Surface replenishment deals, substitutes, and basket-completion offers. | Use recency windows and avoid exposing sensitive purchases in share links. |
| Diet filters | Allergens, dietary preferences, and excluded ingredients/categories. | Filter unsafe items first, then boost compatible alternatives. | Safety filters must run before sponsored or ranking boosts. |
| Household size | Number of people or shopping cadence. | Adjust value scoring toward bulk packs, multi-buys, or smaller packs that reduce waste. | Treat as optional; do not infer household size from purchases without consent. |

## Pluggable ranking

The ranking layer is pluggable. A user can pick exactly one algorithm, or compose multiple algorithms with saved weights. The server stores the selected preset and composes rankers deterministically for reproducible email, print, and share output.

Recommended ranker interface:

```ts
type MyFlyerRanker = {
  id: string;
  label: string;
  score(input: PromotionOffer, signals: MyFlyerSignals): RankedOfferFeature[];
};
```

Baseline rankers:

- **Savings first:** ranks by verified discount depth, absolute savings, and historical deal score.
- **Unit value:** ranks by `effective_unit_price` against comparable products and recent history.
- **Favorite-store first:** prefers the user's saved stores/chains, then proximity.
- **Watchlist first:** prioritizes exact watchlist hits, category matches, and brand alternatives.
- **Basket completion:** boosts offers that complement the recent basket or replace frequently bought items.
- **Diet-safe:** filters incompatible offers and boosts items matching diet preferences.
- **Household fit:** rewards pack sizes and multi-buy terms that make sense for the stored household size.

Composition rules:

1. Eligibility filters run before rankers.
2. Hard safety and hidden-store/product exclusions always win over boosts.
3. Each ranker returns feature-level explanations; the composed score keeps the top reasons for the card.
4. Tie-breakers are deterministic: stronger source confidence, earlier expiry, favorite store, then stable offer id.
5. Sponsored placements may be labelled and inserted in reserved slots, but they must not change organic rank scores.

## Delivery surfaces

All surfaces consume the same server-rendered digest model and record the digest version, ranker configuration, and as-of timestamp.

- **Web `/my-flyer`:** interactive signed-in view with filters, section grouping, reason chips, and links to product/store pages.
- **Opt-in email:** weekly or user-selected cadence. Requires explicit subscription, unsubscribe links, and no sensitive recent-basket details in subject lines or preview text.
- **PWA push:** concise expiring-offer notifications for high-confidence watchlist or favorite-store hits. Requires browser permission and per-user quiet hours.
- **Print:** print stylesheet renders the selected digest with source, dates, and member badges visible without relying on hover states.
- **PDF:** generated server-side from the same print markup and stored with a short retention period unless the user saves it.
- **Share link:** signed, expiring URL that renders a redacted snapshot. It may include offer reasons like `watchlist match` only when the user chooses to share personalized context; otherwise use generic reasons.

## Request pipeline

1. Resolve user, locale, as-of timestamp, selected ranker preset, and delivery surface.
2. Load active promotion candidates from the promotion table/API boundary.
3. Normalize every candidate with `effective_unit_price`, savings, validity, source, and member-required metadata.
4. Load allowed user signals: favorite stores, geolocation, watchlist, recent basket, diet filters, and household size.
5. Apply hard filters: expired offers, low confidence, hidden products/stores, unavailable rows, and diet safety exclusions.
6. Run the selected ranker or ranker composition and keep feature-level explanations.
7. Render the digest server-side into the surface template.
8. Persist a digest audit record containing user id, surface, as-of, ranker ids/weights, promotion observation ids, and delivery status.

## Privacy and quality guardrails

- MyFlyer must be useful with zero optional signals; the fallback is a local active-promotion digest ranked by source confidence, expiry, savings, and unit value.
- Personal signals never leave server-side ranking unless a user explicitly exports or shares personalized explanations.
- Stale, untrusted, or source-missing promotions fail closed.
- Email and push are opt-in only and must honor unsubscribe, quiet hours, and notification limits.
- The same offer id should produce the same rank for the same input, preset, and timestamp so users can audit why an email, PDF, and web digest match.
