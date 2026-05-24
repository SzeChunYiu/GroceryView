# MyFlyer Architecture

`/my-flyer` is a **per-user, server-rendered digest** that combines active
promotions from every grocery chain GroceryView can source, ranks them with the
shopper's own signals, and renders an explainable weekly flyer without requiring
navigation through each retailer's ad.

The feature should feel like "all chain flyers, but already sorted for me". It
must keep every offer tied to source evidence, store scope, validity dates,
member-price labels, and normalized unit economics before presenting it as a
shopper recommendation.

## Product definition

MyFlyer is the personalized presentation layer over the promotion engine:

1. **Input:** all active chain promotions and member offers, anchored in the
   promotion table and price-observation provenance.
2. **Context:** the signed-in user's favorite stores, geolocation, watchlist,
   recent basket, diet filters, and household size.
3. **Ranking:** a pluggable ranker selected by the user, or a composed ranker
   assembled from weighted ranking layers.
4. **Output:** an SSR digest for `/my-flyer` plus opt-in delivery variants for
   email, PWA push, print, PDF, and privacy-preserving share links.

Non-goals for the first version:

- Do not invent promotions when a source row is missing or expired.
- Do not rewrite shelf-price history with temporary member/flyer prices.
- Do not infer dietary safety without product label evidence.
- Do not use location, email, push, or share-link delivery unless the user has
  explicitly opted in to that surface.

## Source-of-truth data

### Promotion pool

The candidate pool starts from the canonical promotion source:

- `promotion_observations` in `db/schema.sql` stores captured flyer rows with
  `product_id`, `chain_id`, optional `store_id`, `promo_start`, `promo_end`,
  `promo_price`, `regular_price_claimed`, `promo_text`, `member_only`,
  multi-buy fields, source type, and confidence.
- The current API path also exposes normalized `observations` rows where
  `price_type in ('promotion', 'member')`, `regular_price is not null`, and the
  active window comes from `valid_from` / `valid_until` or promotion start/end.
- Existing flyer APIs (`/api/deals/flyer-offers` and
  `/api/stores/:id/flyer-offers`) are the read-side proof that promotions remain
  source-run, store, chain, and validity-window scoped.

MyFlyer should read a single active-offer view that can be backed by either
`promotion_observations` or the normalized `observations` table, but the view
must expose the same fields to the ranker:

```ts
type MyFlyerPromotion = {
  promotionId: string;
  sourceRunId?: string;
  productId: string;
  productSlug: string;
  productName: string;
  categoryPath: string[];
  chainId: string;
  chainSlug: string;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  promoPrice: number;
  regularPrice?: number;
  effectiveUnitPrice: EffectiveUnitPrice;
  priceType: 'promotion' | 'member';
  memberRequired: boolean;
  validFrom: string;
  validUntil: string;
  observedAt: string;
  confidence: number;
  provenance: Record<string, unknown>;
};
```

### `effective_unit_price` helper

Ranking must use an explicit `effective_unit_price` helper instead of comparing
raw package prices. The helper normalizes a promotion to the product's comparable
unit (`kr/kg`, `kr/l`, or `kr/st`) and explains how the number was derived.

Recommended contract:

```ts
type EffectiveUnitPrice = {
  amount: number;
  unit: 'kg' | 'l' | 'st';
  basis: 'promo_price' | 'member_price' | 'multi_buy' | 'observed_unit_price';
  quantity: number;
  confidence: number;
  explanation: string;
};
```

Rules:

1. Prefer a trustworthy observed `unit_price` from the normalized observation or
   latest-price row when it already matches `products.comparable_unit`.
2. For multi-buy offers, compute package price as
   `multi_buy_price / multi_buy_quantity`, then normalize by package size.
3. For simple promotions, normalize `promo_price` or member price by the product
   `package_size` and `comparable_unit`.
4. If package metadata is incomplete, keep the offer eligible but mark the
   helper confidence lower and explain that ranking used package price only.
5. Never mix unlike units in the same comparison; cross-product comparison must
   happen only after the helper returns a compatible unit.

This helper is shared by ranking, PDF/email rendering, and explanation copy so a
shopper sees why "2 for 130 kr" won over a smaller single-pack discount.

## User signals

The first-rank signal set is intentionally limited to sources already present in
GroceryView concepts:

| Signal | Use in MyFlyer | Guardrail |
|---|---|---|
| Favorite stores | Boost promotions from stores the user saved; include chain-level offers for those chains. | Do not hide better non-favorite deals unless the selected algorithm says favorite-only. |
| Geolocation | Compute nearest eligible stores and distance-aware sections. | Requires location permission; fall back to favorite stores or no-distance ranking. |
| Watchlist | Boost watched products and trigger "below target" badges. | Use allowed price types; member and promotion prices remain labeled. |
| Recent basket | Boost staples the household recently bought and likely replenishes. | Use recency windows; do not expose basket contents in share links by default. |
| Diet filters | Suppress or demote products that conflict with saved dietary preferences. | Only apply when product labels support the claim; otherwise show "unknown". |
| Household size | Scale savings, stock-up quantity, and expiry relevance for one-person vs family households. | Do not recommend unrealistic quantities when validity or shelf life is short. |

All signals should be transformed into a ranker feature vector with an
explanation payload. Example features: `favoriteStoreMatch`, `distanceKm`,
`watchlistMatch`, `targetPriceDelta`, `recentBasketFrequency`, `dietMatch`,
`householdAdjustedSavings`, `discountPercent`, `effectiveUnitPricePercentile`,
`expiresSoon`, `memberRequired`, and `sourceConfidence`.

## Ranking architecture

Ranking is pluggable. A user can pick one ranking algorithm or compose multiple
algorithms into a weighted stack.

```ts
type MyFlyerRanker = {
  id: string;
  label: string;
  description: string;
  score(input: MyFlyerRankInput): MyFlyerRankResult;
};

type MyFlyerRankResult = {
  score: number;
  reasons: string[];
  badges: string[];
  featureContributions: Record<string, number>;
};
```

Initial rankers:

1. **Balanced value** (default): combines discount depth, effective unit price,
   favorite-store match, distance, source confidence, and household-adjusted
   savings.
2. **Watchlist first:** watched products and below-target prices dominate; other
   deals fill the remaining sections.
3. **Favorite stores first:** local/favorite-store offers outrank distant offers.
4. **Deep discounts:** discount percent and savings dominate, with confidence and
   validity windows as hard gates.
5. **Household stock-up:** multi-buy, pantry staples, and larger household-size
   savings get higher scores.
6. **Diet-safe flyer:** dietary match is a hard filter when labels are known;
   unknown-label offers are grouped separately.

Composition model:

```ts
type MyFlyerRankingPreference =
  | { mode: 'single'; rankerId: string }
  | { mode: 'composed'; layers: { rankerId: string; weight: number }[] };
```

The composed score is a normalized weighted sum of layer scores. The renderer
must preserve per-layer reasons so the user can audit why an offer appeared.

## Server-rendered `/my-flyer` request flow

1. Resolve the authenticated user and load MyFlyer preferences.
2. Load the promotion pool for the current `asOf` timestamp across all chains.
3. Load user signals: favorite stores, geolocation consent/result, watchlist,
   recent basket, diet filters, and household size.
4. Compute `effective_unit_price` for every candidate.
5. Apply hard eligibility gates: active validity window, confidence floor,
   required labels for diet-hard-filter modes, and opt-in member-price handling.
6. Score candidates through the selected or composed ranker.
7. Group into sections such as "Top picks", "Watchlist deals", "Near your
   stores", "Stock-up", "Diet matches", and "Expires soon".
8. Render the digest on the server with no public cache. Cache only the
   non-personalized base promotion pool by `asOf`, chain, and store scope.

Suggested response shape:

```ts
type MyFlyerDigest = {
  userId: string;
  asOf: string;
  rankingPreference: MyFlyerRankingPreference;
  sections: {
    id: string;
    title: string;
    description: string;
    offers: MyFlyerDigestOffer[];
  }[];
  delivery: {
    web: { path: '/my-flyer' };
    emailOptIn: boolean;
    pushOptIn: boolean;
    printable: boolean;
    pdfAvailable: boolean;
    shareLinkAvailable: boolean;
  };
  guardrails: string[];
};
```

## Delivery surfaces

- **Web `/my-flyer`:** canonical SSR surface; full controls for ranker selection,
  signal toggles, and explanations.
- **Opt-in email:** scheduled weekly digest. The email stores a render snapshot
  ID and links back to `/my-flyer`; unsubscribe and frequency controls are
  mandatory.
- **PWA push:** short opt-in alert for high-confidence watchlist or favorite-store
  promotions. Push should link to the web digest, not duplicate the whole flyer.
- **Print:** CSS print view with store grouping, validity dates, unit price,
  member labels, and a compact shopping-list checkbox layout.
- **PDF:** server-rendered snapshot suitable for sharing with a household or
  saving offline; includes generation timestamp and source caveats.
- **Share link:** privacy-preserving snapshot token. By default it includes offer
  rows and public explanations, but excludes raw location, basket history,
  household members, and private watchlist metadata unless explicitly included.

## Persistence and privacy

Potential tables or document records:

- `my_flyer_preferences(user_id, ranking_preference, email_opt_in,
  push_opt_in, include_member_prices, created_at, updated_at)`
- `my_flyer_snapshots(id, user_id, as_of, ranking_preference, sections_json,
  created_at, expires_at)`
- `my_flyer_share_links(token_hash, snapshot_id, scope, expires_at,
  revoked_at)`

Privacy requirements:

- Personalized digest responses are user-private and must not be CDN cached.
- Email, push, PDF, and share links are opt-in delivery surfaces.
- Share-link payloads should be snapshots, not live user views.
- Location and recent-basket signals must appear only as coarse explanations
  unless the user is viewing their own authenticated digest.

## Observability and quality gates

Track the following per render and per delivery job:

- promotion candidates loaded, eligible, and ranked;
- number of chains and stores represented;
- offers missing effective unit price and why;
- ranker selected/composed weights;
- source-confidence distribution;
- email/push/PDF/share-link delivery status;
- user feedback events: saved, hidden, opened, added to basket, and dismissed.

Acceptance gates for launch:

1. Every rendered offer has a promotion/source row, active validity window,
   chain/store scope, confidence, and provenance.
2. Every rendered offer displays raw price and `effective_unit_price`.
3. All six user signals are available to the ranker, with graceful fallback when
   a user has not provided a signal.
4. The user can select one ranker or compose rankers with weights.
5. Web, email, PWA push, print, PDF, and share-link delivery surfaces have clear
   opt-in and privacy behavior.
