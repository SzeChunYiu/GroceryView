# percentOff ranker

The `percentOff` ranker orders explicit promotion rows by verified percentage discount. It is a lightweight deal-ranking helper for UI sections that need a transparent “largest advertised discount first” sort.

## Signals used

- `current_price`: the price a shopper pays for the promotion unit.
- `regular_price`: the non-promotional comparison price from the same source and unit.
- `source_confidence`: 0–1 confidence assigned to the retailer/feed/receipt source.
- `observed_at`: timestamp used only for freshness tie-breaking.
- `availability`: optional in-stock/available flag; unavailable rows are excluded before ranking.

## Scoring formula

```text
raw_percent_off = ((regular_price - current_price) / regular_price) * 100
confidence_adjusted = raw_percent_off * clamp(source_confidence, 0, 1)
score = round(confidence_adjusted, 2)
```

Rows sort by:

1. `score` descending
2. `raw_percent_off` descending
3. `observed_at` descending
4. stable product id ascending

## Edge cases

- Missing or non-positive `regular_price`: row is not ranked because the denominator is unsafe.
- `current_price >= regular_price`: row receives `0` and should usually be hidden from deal modules.
- Multi-buy offers: first convert to effective unit price before applying this ranker.
- Member-only prices: rank only inside member-only surfaces unless the user opted in.
- Mixed units: normalize to the same unit before scoring; do not compare pack and kg prices directly.
- Stale observations: keep the score but let freshness filters remove expired rows.

## When not to use it

- Do not use for long-term price index calculations.
- Do not use for “cheapest item” decisions; use actual unit price instead.
- Do not use when regular price is inferred rather than source-provided.
- Do not use across incomparable sizes unless an effective unit price has already been computed.
- Do not use for sponsored placement ordering.

## Fixture examples

Input:

```json
[
  { "id": "milk-1l", "current_price": 10, "regular_price": 15, "source_confidence": 0.95, "observed_at": "2026-05-24T08:00:00Z" },
  { "id": "coffee-450g", "current_price": 49, "regular_price": 69, "source_confidence": 0.85, "observed_at": "2026-05-24T07:00:00Z" },
  { "id": "pasta-500g", "current_price": 12, "regular_price": 12, "source_confidence": 0.9, "observed_at": "2026-05-23T18:00:00Z" }
]
```

Sample output:

| Rank | id | raw_percent_off | score | explanation |
| --- | --- | ---: | ---: | --- |
| 1 | `milk-1l` | 33.33 | 31.67 | Larger verified discount after confidence adjustment. |
| 2 | `coffee-450g` | 28.99 | 24.64 | Valid discount but lower confidence-adjusted score. |
| 3 | `pasta-500g` | 0.00 | 0.00 | No discount; hide from deal modules unless debugging. |

The ranker returns both `raw_percent_off` and `score` so UI copy can show the human-facing discount while internal ordering remains confidence-adjusted.
