# Nearby Ranker

Last verified: 2026-05-25 against `packages/core/src/lib/rankers/nearby.ts`.

The nearby ranker orders promotion candidates for a shopper by combining observed savings with straight-line distance from the shopper's home coordinates. It is deterministic and does not call external services.

## Inputs

`rankNearbyPromos` accepts:

| Field | Meaning |
| --- | --- |
| `user.home_lat`, `user.home_lng` | Shopper home latitude and longitude. |
| `promos[]` | Promotion candidates. Each row must have `storeId` and numeric `savings`; extra promo fields are preserved in the output. |
| `stores[]` | Store coordinates keyed by `storeId`. |
| `maxDistanceKm` or `max_distance_km` | Required maximum straight-line radius in kilometers. |

Outputs preserve each accepted promo row and add:

| Field | Meaning |
| --- | --- |
| `distance_km` | Haversine distance from the shopper to the matched store. |
| `distanceKm` | Camel-case alias of `distance_km`. |
| `score` | Distance-discounted savings score used for sorting. |

## Signals

The ranker uses only two scoring signals:

| Signal | Source | Effect |
| --- | --- | --- |
| `savings` | Promo candidate | Higher savings increases score linearly. |
| `distance_km` | Haversine distance between `user` and matched `store` coordinates | Longer distance exponentially lowers score. |

The ranker does not use inventory, source confidence, product match confidence, price history, opening hours, delivery fees, route travel time, loyalty eligibility, or basket-level constraints.

## Formula

Distance is computed with the Haversine formula using Earth radius `6371` km:

```text
deltaLat = radians(store.lat - user.home_lat)
deltaLng = radians(store.lng - user.home_lng)
a = sin(deltaLat / 2)^2
  + cos(radians(user.home_lat))
  * cos(radians(store.lat))
  * sin(deltaLng / 2)^2
distance_km = 6371 * 2 * atan2(sqrt(a), sqrt(max(0, 1 - a)))
```

Score is:

```text
score = savings * exp(-distance_km / 5)
```

Rows are sorted by:

1. Higher `score`.
2. Lower `distance_km` when scores tie.
3. Higher `savings` when score and distance tie.

## Edge Cases

- Coordinates are validated before scoring. Latitudes must be finite values from `-90` to `90`; longitudes must be finite values from `-180` to `180`.
- `maxDistanceKm` is required through either `maxDistanceKm` or `max_distance_km`. It must be finite and non-negative.
- Promo rows with non-finite `savings` are skipped.
- Promo rows whose `storeId` is absent from `stores[]` are skipped.
- Promo rows whose matched store is farther than the configured maximum distance are skipped.
- Store rows are collected into a `Map` by `storeId`; if duplicate store ids are supplied, the last coordinate row for that id is the one used.
- Negative finite `savings` values are not rejected by this function. Callers should filter or normalize candidates before ranking if negative savings should be impossible.

## When Not To Use It

Do not use this ranker as the only signal for shopper-facing deal quality. It intentionally ignores price history, source confidence, stock status, and whether the promotion is actually eligible for the shopper.

Do not use it for delivery, pickup, or route planning decisions where travel time, transport mode, fees, order minimums, or store hours matter. It uses straight-line distance only.

Do not use it when user or store coordinates are missing or low quality. The function throws on invalid coordinates and drops promos with unmatched stores.

Do not use it to compare whole baskets. It ranks individual promotion candidates and does not account for basket completeness, substitutions, or multi-store trip cost.

## Sample Outputs

The examples below use this shared shopper coordinate:

```json
{
  "home_lat": 59.334591,
  "home_lng": 18.06324
}
```

### Fixture 1: Nearby Stores Inside Radius

Input:

```json
{
  "user": { "home_lat": 59.334591, "home_lng": 18.06324 },
  "maxDistanceKm": 3,
  "promos": [
    { "promoId": "coffee-willys", "storeId": "willys-odenplan", "savings": 20 },
    { "promoId": "pasta-hemkop", "storeId": "hemkop-torsplan", "savings": 25 },
    { "promoId": "detergent-willys", "storeId": "willys-alvik", "savings": 60 }
  ],
  "stores": [
    { "storeId": "willys-odenplan", "lat": 59.3422, "lng": 18.0495 },
    { "storeId": "hemkop-torsplan", "lat": 59.3498, "lng": 18.0332 },
    { "storeId": "willys-alvik", "lat": 59.3339, "lng": 17.9825 }
  ]
}
```

Output, rounded for display:

```json
[
  {
    "promoId": "coffee-willys",
    "storeId": "willys-odenplan",
    "savings": 20,
    "distance_km": 1.150,
    "distanceKm": 1.150,
    "score": 15.890
  },
  {
    "promoId": "pasta-hemkop",
    "storeId": "hemkop-torsplan",
    "savings": 25,
    "distance_km": 2.400,
    "distanceKm": 2.400,
    "score": 15.469
  }
]
```

`detergent-willys` is excluded because the Alvik store is about `4.580` km away, beyond `maxDistanceKm: 3`.

### Fixture 2: Bigger Savings Can Beat Closer Stores

Input:

```json
{
  "user": { "home_lat": 59.334591, "home_lng": 18.06324 },
  "max_distance_km": 12,
  "promos": [
    { "promoId": "milk-near", "storeId": "near-small", "savings": 8 },
    { "promoId": "diapers-mid", "storeId": "mid-large", "savings": 40 },
    { "promoId": "laundry-far", "storeId": "far-huge", "savings": 120 }
  ],
  "stores": [
    { "storeId": "near-small", "lat": 59.335, "lng": 18.064 },
    { "storeId": "mid-large", "lat": 59.356, "lng": 18.036 },
    { "storeId": "far-huge", "lat": 59.41, "lng": 17.95 }
  ]
}
```

Output, rounded for display:

```json
[
  {
    "promoId": "diapers-mid",
    "storeId": "mid-large",
    "savings": 40,
    "distance_km": 2.838,
    "distanceKm": 2.838,
    "score": 22.677
  },
  {
    "promoId": "laundry-far",
    "storeId": "far-huge",
    "savings": 120,
    "distance_km": 10.558,
    "distanceKm": 10.558,
    "score": 14.527
  },
  {
    "promoId": "milk-near",
    "storeId": "near-small",
    "savings": 8,
    "distance_km": 0.063,
    "distanceKm": 0.063,
    "score": 7.900
  }
]
```

The closest offer ranks last because its savings are small after applying the same distance penalty.

### Fixture 3: Invalid Candidates Are Dropped

Input:

```json
{
  "user": { "home_lat": 59.334591, "home_lng": 18.06324 },
  "maxDistanceKm": 2,
  "promos": [
    { "promoId": "accepted", "storeId": "willys-odenplan", "savings": 20 },
    { "promoId": "missing-store", "storeId": "unknown-store", "savings": 50 },
    { "promoId": "not-finite", "storeId": "willys-odenplan", "savings": null }
  ],
  "stores": [
    { "storeId": "willys-odenplan", "lat": 59.3422, "lng": 18.0495 }
  ]
}
```

Output, rounded for display:

```json
[
  {
    "promoId": "accepted",
    "storeId": "willys-odenplan",
    "savings": 20,
    "distance_km": 1.150,
    "distanceKm": 1.150,
    "score": 15.890
  }
]
```

The unknown store candidate is dropped because no coordinate row exists. The non-finite savings candidate is dropped before distance scoring.
