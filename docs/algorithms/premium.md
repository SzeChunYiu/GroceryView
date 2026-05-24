# Premium ranker algorithm

The premium ranker orders products for premium surfaces without using ad placement, sponsorship, or paid boosts.

## Signals

| Signal | Meaning | Direction |
| --- | --- | --- |
| `dealScore` | Core deal score from visible current price, history, unit-price comparables, discount depth, and source confidence. | Higher is better. |
| `sourceConfidence` | Confidence in the price evidence source. | Higher is better. |
| `unitPricePercentile` | Percentile rank within the comparable category. | Lower is better. |
| `freshnessHours` | Age of latest observed price. | Lower is better. |
| `privateLabelMatch` | Same-category private-label substitute exists. | Adds a small boost when the user allows swaps. |
| `availabilityPenalty` | Missing or out-of-stock evidence. | Penalizes or removes the row. |

## Scoring formula

Normalize every component to `0..100`.

```text
premiumRankScore =
  0.40 * dealScore
+ 0.25 * sourceConfidenceScore
+ 0.20 * (100 - unitPricePercentile)
+ 0.10 * freshnessScore
+ 0.05 * privateLabelBoost
- availabilityPenalty
```

Where:

- `sourceConfidenceScore = sourceConfidence * 100`
- `freshnessScore = max(0, 100 - freshnessHours / 24 * 10)`
- `privateLabelBoost = 100` only when a verified same-category private-label swap exists and the user opted in
- `availabilityPenalty = 100` for confirmed out-of-stock, `25` for unknown availability, otherwise `0`

Ties are broken by newer evidence, then lower unit price, then stable product id.

## Edge cases

- Missing price history: keep the row, but cap `dealScore` at the core low-history cap.
- Unknown availability: do not remove the row, but apply the `25` point penalty and label the row.
- Confirmed out-of-stock: remove from "buy now" modules; it may appear in history-only modules.
- Sponsored products: sponsorship is ignored by the ranker and handled by ad disclosure policy.
- Sparse category comparables: use the category median fallback and mark confidence `low`.

## When not to use it

- Do not use for paid ad ordering or sponsored placements.
- Do not use for safety-critical food recall warnings.
- Do not use when the user asks for strict cheapest-price sorting.
- Do not use when fewer than two comparable products have valid unit prices.
- Do not use for legal, medical, or nutrition claims beyond the product evidence shown.

## Fixture outputs

| Fixture | Inputs | Score | Output |
| --- | --- | ---: | --- |
| `budget-private-label-pasta` | dealScore 86, sourceConfidence 0.9, unitPricePercentile 12, freshness 8h, privateLabelMatch true, available | 89.8 | Rank 1, `premium_pick: strong value` |
| `national-brand-coffee` | dealScore 74, sourceConfidence 0.8, unitPricePercentile 38, freshness 18h, no private-label boost, available | 69.6 | Rank 2, `premium_pick: compare` |
| `unknown-stock-olive-oil` | dealScore 81, sourceConfidence 0.7, unitPricePercentile 22, freshness 30h, no boost, unknown availability | 59.6 | Rank 3, `availability: verify before recommending` |
