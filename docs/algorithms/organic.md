# organic ranker

The `organic` ranker orders products and offers by how strongly their source-backed evidence indicates certified organic status. It is intended for organic-first shopping surfaces where users still need price, freshness, and availability to break ties between otherwise comparable items.

## Signals used

- `organic_certification`: explicit certification or label evidence from the source, such as EU Organic, KRAV, Debio, or another supported national organic mark.
- `label_text`: normalized product, badge, and shelf-label text used only when it contains source-visible organic terms.
- `source_confidence`: 0–1 confidence for the retailer feed, connector, receipt, or manually reviewed source.
- `availability`: optional in-stock/available flag; unavailable rows are excluded before ranking.
- `current_price` and `unit_price`: used only as tie-breakers after organic evidence is scored.
- `observed_at`: timestamp used for freshness tie-breaking when organic scores are equal.

## Scoring formula

```text
cert_signal = 1.00 when a recognized organic certification is present
cert_signal = 0.70 when the source has explicit organic label text but no mapped certification
cert_signal = 0.00 when there is no organic evidence
confidence_adjusted = cert_signal * clamp(source_confidence, 0, 1)
score = round(confidence_adjusted * 100, 2)
```

Rows sort by:

1. `score` descending
2. recognized certification priority descending (`KRAV`/local organic marks before generic text-only claims)
3. `unit_price` ascending when units are comparable
4. `observed_at` descending
5. stable product id ascending

## Edge cases

- Unrecognized badges: treat as `0.70` text evidence only when the source text clearly says organic; otherwise route to review.
- Conflicting evidence: if one field says organic and another explicitly says conventional, set the score to `0` and route to review.
- Private marketing names: words like “natural”, “green”, “eco pack”, or brand names that imply sustainability are not organic evidence by themselves.
- Bulk and loose produce: rank only when the store, bin, or PLU row carries explicit organic evidence.
- Missing `source_confidence`: default to the source class baseline rather than assuming full confidence.
- Incomparable units: do not use `unit_price` as a tie-breaker across different units, such as kg versus each.

## When not to use it

- Do not use it to infer certification for compliance, audit, or legal reporting.
- Do not use it for sustainability ranking beyond organic status; carbon, local, animal welfare, and packaging need separate signals.
- Do not use it when organic status is inferred from a product family but absent from the current row.
- Do not use it to override explicit user filters for price, allergens, store, or availability.
- Do not use it for sponsored placement ordering.

## Fixture examples

Input:

```json
[
  { "id": "eggs-6-krav", "organic_certification": "KRAV", "label_text": "KRAV ekologiska ägg 6-pack", "source_confidence": 0.98, "unit_price": 4.82, "observed_at": "2026-05-24T08:00:00Z" },
  { "id": "banana-organic", "organic_certification": null, "label_text": "Ekologiska bananer", "source_confidence": 0.88, "unit_price": 31.9, "observed_at": "2026-05-24T07:30:00Z" },
  { "id": "milk-natural", "organic_certification": null, "label_text": "Naturligt god mjölk", "source_confidence": 0.93, "unit_price": 14.5, "observed_at": "2026-05-23T18:00:00Z" }
]
```

Sample output:

| Rank | id | cert_signal | score | explanation |
| --- | --- | ---: | ---: | --- |
| 1 | `eggs-6-krav` | 1.00 | 98.00 | Recognized KRAV certification with high source confidence. |
| 2 | `banana-organic` | 0.70 | 61.60 | Explicit organic label text, but no mapped certification. |
| 3 | `milk-natural` | 0.00 | 0.00 | “Natural” is not organic evidence, so the row should not appear in organic-only modules. |

The ranker returns the mapped evidence type, `cert_signal`, and final `score` so UI copy can distinguish certified organic rows from lower-confidence text-only matches.
