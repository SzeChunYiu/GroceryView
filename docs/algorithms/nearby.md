# Nearby ranker

## Purpose

The nearby ranker explains which store or basket option is most useful for a shopper near a known location. It is not a standalone "closest store wins" algorithm: GroceryView keeps verified price coverage first, then uses travel cost or distance as a planning signal only where the calling flow explicitly opts in.

## Signals used

| Signal | Source | How it is used |
| --- | --- | --- |
| Verified shelf or offer prices | Ingested store observations, flyers, online rows, receipts, or approved manual evidence | Required before an option can be ranked as complete. Missing required products block completion. |
| Product coverage | Requested basket lines versus matched priced lines per store | Higher coverage ranks ahead of lower coverage in local-offer summaries. |
| Subtotal / shelf total | Sum of matched line prices | Lower subtotal wins after coverage and completeness gates. |
| Confidence | Observation confidence from the source path | Tie-breaker after subtotal in local-offer summaries; also surfaced as high/medium/low. |
| Freshness | `observedAt` compared with the caller's `asOf` and stale threshold | Stale rows are still visible but flagged so users can decide whether to trust them. |
| Distance and duration | Store metadata, map provider, or fixture travel profiles | Used only by trip-cost planning flows; otherwise shown as context and not allowed to override verified savings. |
| Travel-cost inputs | Mode, value of time, car cost/km, transit fare, delivery fee, split-shop penalty | Converts distance/time into a separate planning cost for `planBasketTripCost`. |

## Scoring formula

### Local offer / nearby-store summaries

For `summarizeLocalOfferBasket`, each candidate store is reduced to:

```text
coveragePercent = matchedLines / requestedLines * 100
subtotal = sum(best available unitPrice * quantity)
averageConfidence = mean(best available confidence per matched line)
stale = observedAt older than staleAfterHours
```

Stores are ranked by:

1. higher `coveragePercent`
2. lower `subtotal`
3. higher `averageConfidence`
4. store name as a deterministic tie-breaker

Distance is deliberately not part of this rank. It can be displayed with the row, but it cannot make a nearby expensive store outrank a farther verified cheaper store in this summary.

### Trip-cost planning

For `planBasketTripCost`, only complete options are eligible for `bestOption`. The effective total is:

```text
distanceCost = travelMode == car ? distanceKm * carCostPerKm : 0
timeCost = durationMinutes / 60 * valueOfTimePerHour
modeCost = travelMode == transit ? transitFare : travelMode == delivery ? deliveryFee : 0
splitCost = storeCount > 1 ? splitTripPenalty : 0
travelCost = distanceCost + timeCost + modeCost + splitCost
effectiveTotal = pricedBasketTotal + travelCost
```

Complete options sort by lower `effectiveTotal`, then lower shelf total, then label. Incomplete options stay visible with warnings, but their `effectiveTotal` is `null` and they do not become the best option.

## Edge cases

- **Missing price evidence:** keep the row, mark the missing product ids, and do not rank it as complete.
- **Unavailable product evidence:** separate known unavailable products from unknown/missing rows.
- **Stale observations:** keep the price visible with a stale flag instead of silently dropping it.
- **Split shopping:** apply an explicit split penalty when one basket requires more than one store.
- **Negative inputs:** reject negative prices, distances, durations, delivery fees, and travel-cost parameters.
- **Member-only prices:** include only when the shopper has enabled that store's membership; otherwise record the exclusion.
- **Distance-only ties:** if price/coverage/confidence do not require travel scoring, do not let distance decide the organic rank.

## When not to use it

Do not use the nearby ranker for retailer checkout confirmation, delivery promises, sponsored placement ordering, national chain price indexes, nutrition-per-krona ranking, or source quality audits. Do not use it when the caller lacks a shopper location or when the product set has no verified price evidence; show missing-evidence blockers instead.

## Fixture examples

### 1. Nearby one-stop shop beats a cheaper far split after travel cost

Input options:

| Strategy | Shelf total | Stores | Distance | Duration | Missing |
| --- | ---: | --- | ---: | ---: | --- |
| Cheapest across Willys + Lidl | 150 SEK | 2 | 8.0 km | 28 min | none |
| Nearby Coop one-stop shop | 164 SEK | 1 | 1.2 km | 8 min | none |

With `carCostPerKm=3.5`, `valueOfTimePerHour=120`, and `splitTripPenalty=15`, the far split has travel cost `99.00 SEK` and effective total `249.00 SEK`; the nearby one-stop shop has travel cost `20.20 SEK` and effective total `184.20 SEK`. Output: `near-one-store` is `bestOption`.

### 2. Incomplete nearby quote stays blocked

Input: an ICA quote has shelf total `130 SEK`, distance `0.6 km`, duration `6 min`, but missing `butter`.

Output:

```json
{
  "strategyId": "missing-price",
  "travelCost": 14.1,
  "effectiveTotal": null,
  "missingProductIds": ["butter"],
  "warnings": ["Missing verified prices for: butter."]
}
```

The option remains visible for transparency, but it cannot outrank complete baskets.

### 3. Distance is excluded from local-offer rank

Input offers for one coffee line:

| Store | Unit price | Distance | Confidence |
| --- | ---: | ---: | ---: |
| Far Cheap Store | 39.90 SEK | 12.0 km | 0.80 |
| Near Expensive Store | 49.90 SEK | 0.2 km | 0.95 |

Output: `Far Cheap Store` is the best local-offer store because both stores have full coverage and the lower verified subtotal wins. The near store's distance is context, not a rank boost.
