# Premium Brand Promo Ranker

Last verified: 2026-05-25 against `packages/core/src/lib/rankers/premium.ts`.

The premium ranker finds promotions for brands that have been explicitly marked as premium and orders those promotions by visible savings. It is deterministic, preserves the input promo fields, and does not call external services.

## Inputs

`rankPremiumBrandPromos` accepts:

| Field | Meaning |
| --- | --- |
| `brands[]` | Brand metadata rows. Each row must include `canonical_id`; only rows with `premium: true` are eligible. |
| `promos[]` | Promotion candidates. Each row must include `promoId`, `productId`, `productName`, `brand_canonical_id`, and numeric `savings`; extra promo fields are preserved. |
| `topN` | Optional positive integer limit. Defaults to `10`. |

Outputs preserve each accepted promo and add:

| Field | Meaning |
| --- | --- |
| `rank` | One-based rank after filtering and sorting. |

## Signals

The ranker uses only two signals:

| Signal | Source | Effect |
| --- | --- | --- |
| Premium brand membership | `brands[].premium === true` and matching `canonical_id` | Non-premium brands are excluded before sorting. |
| Visible savings | `promos[].savings` | Higher finite savings ranks first. |

The ranker does not use price history, inventory, distance, source confidence, household preferences, loyalty eligibility, sponsored placement, basket completeness, or margin data.

## Scoring Formula

There is no weighted score. Filtering and ordering are the full algorithm:

```text
premiumIds = set(brand.canonical_id where brand.premium === true)
eligiblePromos = promos where premiumIds contains promo.brand_canonical_id
sort eligiblePromos by:
  1. savings descending
  2. productName ascending
  3. promoId ascending
return first topN with rank = index + 1
```

## Edge Cases

- `topN` defaults to `10` and must be a positive integer.
- Every brand `canonical_id` must be non-blank, even for non-premium brands.
- Each promo must have non-blank `promoId`, `productId`, `productName`, and `brand_canonical_id`.
- `savings` must be finite. `NaN`, `Infinity`, and `null` are invalid.
- Promos whose `brand_canonical_id` is absent from `brands[]` are dropped.
- Duplicate premium brand ids are harmless because the implementation uses a `Set`.
- Negative finite savings values are allowed by the function and will sort below positive savings. Callers should filter them first if negative savings should be impossible.

## When Not To Use It

Do not use this ranker as a general deal-quality score. It ignores history, confidence, stock, distance, freshness, and equivalent unit price.

Do not use it for ad placement or sponsored ordering. Sponsored status is not an input and must stay outside this ranking decision.

Do not use it for shopper personalization unless the caller has already filtered by consented account preferences. This function only knows whether a brand is premium.

Do not use it when premium brand flags are stale or inferred. A brand must be explicitly marked `premium: true` before its promos can appear.

## Sample Outputs

### Fixture 1: Premium Brand Savings Sort

Input:

```json
{
  "topN": 3,
  "brands": [
    { "canonical_id": "arlo", "premium": true },
    { "canonical_id": "budget-house", "premium": false },
    { "canonical_id": "zoegas", "premium": true }
  ],
  "promos": [
    { "promoId": "p1", "productId": "coffee-1", "productName": "Zoegas Coffee", "brand_canonical_id": "zoegas", "savings": 18 },
    { "promoId": "p2", "productId": "milk-1", "productName": "Arlo Milk", "brand_canonical_id": "arlo", "savings": 6 },
    { "promoId": "p3", "productId": "pasta-1", "productName": "Budget Pasta", "brand_canonical_id": "budget-house", "savings": 30 }
  ]
}
```

Output:

```json
[
  { "promoId": "p1", "productId": "coffee-1", "productName": "Zoegas Coffee", "brand_canonical_id": "zoegas", "savings": 18, "rank": 1 },
  { "promoId": "p2", "productId": "milk-1", "productName": "Arlo Milk", "brand_canonical_id": "arlo", "savings": 6, "rank": 2 }
]
```

`Budget Pasta` is excluded because its brand is not premium.

### Fixture 2: Tie Breakers

Input:

```json
{
  "brands": [{ "canonical_id": "premium-a", "premium": true }],
  "promos": [
    { "promoId": "z-last", "productId": "tea-2", "productName": "Premium Tea", "brand_canonical_id": "premium-a", "savings": 10 },
    { "promoId": "a-first", "productId": "tea-1", "productName": "Premium Tea", "brand_canonical_id": "premium-a", "savings": 10 },
    { "promoId": "m-middle", "productId": "coffee-1", "productName": "Premium Coffee", "brand_canonical_id": "premium-a", "savings": 10 }
  ]
}
```

Output:

```json
[
  { "promoId": "m-middle", "productId": "coffee-1", "productName": "Premium Coffee", "brand_canonical_id": "premium-a", "savings": 10, "rank": 1 },
  { "promoId": "a-first", "productId": "tea-1", "productName": "Premium Tea", "brand_canonical_id": "premium-a", "savings": 10, "rank": 2 },
  { "promoId": "z-last", "productId": "tea-2", "productName": "Premium Tea", "brand_canonical_id": "premium-a", "savings": 10, "rank": 3 }
]
```

Savings tie first, so `productName` decides; `promoId` breaks the two tea rows.

### Fixture 3: Limit Output

Input:

```json
{
  "topN": 1,
  "brands": [{ "canonical_id": "premium-a", "premium": true }],
  "promos": [
    { "promoId": "small", "productId": "jam-1", "productName": "Premium Jam", "brand_canonical_id": "premium-a", "savings": 4 },
    { "promoId": "large", "productId": "oil-1", "productName": "Premium Oil", "brand_canonical_id": "premium-a", "savings": 22 }
  ]
}
```

Output:

```json
[
  { "promoId": "large", "productId": "oil-1", "productName": "Premium Oil", "brand_canonical_id": "premium-a", "savings": 22, "rank": 1 }
]
```

Only the highest-savings premium promo is returned because `topN` is `1`.
