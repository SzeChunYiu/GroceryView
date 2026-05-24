# Quick wins ranker

The quick wins ranker chooses immediately actionable grocery savings from verified price rows. It is meant for surfaces such as "top deals near me", store deal summaries, and basket add-on suggestions where the user needs a short ordered list rather than a full catalogue.

## Inputs and signals

Each candidate row must be a real product/store price observation. The ranker uses these signals:

| Signal | Field or source | Why it matters |
| --- | --- | --- |
| Deal Score | `dealScore` from `calculateDealScore` / historical scoring | Primary measure of whether the current price is unusually good. |
| Current price | `currentPrice` or store-row `price` | Used for display and tie-breaking after score/discount. |
| Regular or comparison price | `regularPrice`, observed median, or chain comparison baseline | Converts the offer into an explicit price drop and discount percent. |
| Source confidence | `sourceConfidence` | Blocks stale, estimated, or weakly matched rows from winning. |
| Sponsored flag | `sponsoredPlacement` | Ads are excluded; paid placement must not boost ranking. |
| Product/store labels | `productName`, `storeName`, `category`, `storeId` | Used for explanation text and stable tie-breaking. |

The current implementation shape is `rankDealOpportunities({ deals, minimumDealScore, minimumSourceConfidence })` in `packages/core/src/index.ts`. Store-level quick-win summaries in `packages/api/src/index.ts` sort current verified store deal rows by `dealScore`, then by cheaper price and product name when the score ties.

## Scoring formula

For candidates that already have a Deal Score, quick wins apply this formula:

1. Filter out `sponsoredPlacement === true`.
2. Filter out rows with `dealScore < minimumDealScore` (default `60`).
3. Filter out rows with `sourceConfidence < minimumSourceConfidence` (default `0.5`).
4. Calculate:
   - `priceDrop = max(0, regularPrice - currentPrice)`, rounded to öre precision.
   - `discountPercent = regularPrice > 0 ? priceDrop / regularPrice * 100 : 0`, rounded to two decimals.
   - `band = scoreBand(dealScore)`.
5. Sort descending by `dealScore`, then descending by `discountPercent`, then ascending by `productName`.

The Deal Score feeding the ranker is weighted as:

```text
score = round(
  (100 - currentCityPercentile) * 0.40 +
  (100 - knownPromoHistoryPercentile) * 0.25 +
  (100 - equivalentUnitPricePercentile) * 0.20 +
  discountDepthPercent * 0.10 +
  sourceConfidence * 100 * 0.05
)
```

Sponsored placement is intentionally ignored by `calculateDealScore` and excluded by the quick wins ranker.

## Edge cases

- **Same Deal Score:** rank larger `discountPercent` first; if still tied, sort by `productName` for deterministic output.
- **Missing or zero regular price:** keep `priceDrop` non-negative and set `discountPercent` to `0`; the row can only win on Deal Score.
- **Current price above regular price:** clamp `priceDrop` to `0` so the explanation never claims a negative saving.
- **Low-confidence data:** do not surface below the configured confidence floor; show a coverage warning elsewhere instead.
- **Sponsored rows:** exclude even when the Deal Score is high.
- **Duplicate products across stores:** keep store rows separate when the user is comparing stores; collapse only in a caller that explicitly wants one row per product.
- **Perishable or very local prices:** require recent observations and store context before presenting as a quick win.

## When not to use it

Do **not** use quick wins when:

- The user asked for a complete product catalogue or all prices, not a ranked shortlist.
- The row is based only on unverified manual input, OCR text, or a private receipt without a public/store-backed price.
- The comparison price is fabricated, estimated, or too old for the product category.
- A legal/compliance surface requires showing every eligible offer with equal prominence.
- The task is basket optimization across multiple stores; use the basket/store optimizer instead because it accounts for quantities and travel tradeoffs.
- The candidate is a member-only, coupon, or sponsored offer unless the UI has explicitly opted into that eligibility and labels it.

## Sample output for fixture inputs

Fixture inputs:

```json
[
  {
    "productId": "coffee",
    "productName": "Zoégas Coffee 450g",
    "storeId": "willys-odenplan",
    "storeName": "Willys Odenplan",
    "currentPrice": 49.90,
    "regularPrice": 69.90,
    "dealScore": 86,
    "sourceConfidence": 0.91
  },
  {
    "productId": "butter",
    "productName": "Butter 600g",
    "storeId": "coop-odenplan",
    "storeName": "Coop Odenplan",
    "currentPrice": 42.90,
    "regularPrice": 59.90,
    "dealScore": 86,
    "sourceConfidence": 0.88
  },
  {
    "productId": "rice",
    "productName": "Rice 1kg",
    "storeId": "lidl-sveavagen",
    "storeName": "Lidl Sveavägen",
    "currentPrice": 18.90,
    "regularPrice": 19.90,
    "dealScore": 58,
    "sourceConfidence": 0.90
  },
  {
    "productId": "soda-sponsored",
    "productName": "Sponsored Soda 1.5L",
    "storeId": "ica-city",
    "storeName": "ICA City",
    "currentPrice": 14.90,
    "regularPrice": 24.90,
    "dealScore": 95,
    "sourceConfidence": 0.99,
    "sponsoredPlacement": true
  }
]
```

Expected quick wins with defaults:

| Rank | Product | Store | Score band | Saving | Explanation |
| --- | --- | --- | --- | --- | --- |
| 1 | Zoégas Coffee 450g | Willys Odenplan | Good deal / Buy | 20.00 SEK (28.61%) | Higher discount percent wins the tie at Deal Score 86. |
| 2 | Butter 600g | Coop Odenplan | Good deal / Buy | 17.00 SEK (28.38%) | Same score as coffee but slightly lower discount percent. |
| — | Rice 1kg | Lidl Sveavägen | Not shown | 1.00 SEK (5.03%) | Deal Score 58 is below the default threshold of 60. |
| — | Sponsored Soda 1.5L | ICA City | Not shown | 10.00 SEK (40.16%) | Sponsored placement is excluded even with a high score. |

The returned rows include the original product/store identifiers plus `band`, `priceDrop`, `discountPercent`, and a human-readable `reason` string.
