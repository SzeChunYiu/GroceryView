# quickWins ranker

`quickWins` ranks grocery actions that are cheap to act on now: buy a verified deal, swap to a lower unit price, or add a recurring staple before a basket is checked out. It is a shopper-facing ranker, not a forecast model.

## Signals used

For each candidate action, collect these normalized signals:

- `savingsPct` — percent savings versus the shopper's current basket line or median observed price.
- `savingsSek` — absolute SEK savings capped at 75 SEK so one expensive item does not dominate.
- `confidence` — source confidence from verified price rows, package/unit evidence, and freshness.
- `effort` — estimated action cost from 0 to 1; lower effort wins.
- `freshnessHours` — age of the newest source row.
- `preferenceFit` — 0 to 1 match against favorite stores, dietary filters, avoided brands, and household staples.
- `stockRisk` — 0 to 1 penalty for missing stock, expiring promotions, or sparse store coverage.

## Scoring formula

```text
quickWinScore =
  0.30 * clamp(savingsPct / 40, 0, 1) +
  0.20 * clamp(savingsSek / 75, 0, 1) +
  0.20 * confidence +
  0.15 * preferenceFit +
  0.10 * (1 - effort) +
  0.05 * freshnessBoost -
  0.25 * stockRisk
```

`freshnessBoost` is `1` for rows newer than 24 hours, `0.5` for rows between 24 and 72 hours, and `0` after 72 hours. Clamp the final score to `[0, 1]`, then sort descending. Tie-break by higher absolute SEK savings, then lower effort, then product name.

## Edge cases

- Missing or non-positive price evidence: return `score = 0` and hide the action from default rails.
- Unknown package size: allow total-price quick wins, but do not claim unit-price savings.
- Personalized exclusions: if dietary, allergen, or excluded-brand filters reject the item, set `score = 0` even when savings are high.
- Stale rows over 7 days old: require a visible freshness warning and halve the score.
- Multi-store actions: increase `effort` unless the store is already in the shopper's planned route.

## When not to use quickWins

Do not use this ranker for long-term price forecasts, nutrition optimization, sponsored placements, medical/dietary safety decisions, or inventory claims without verified stock evidence. Use specialized rankers for forecast timing, meal planning, or ad allocation.

## Sample outputs

| Fixture input | Key signals | Output |
| --- | --- | --- |
| `coffee-deal-willys` | 28% off, 20 SEK saved, confidence 0.92, favorite store, fresh row | `score: 0.78`, reason: `High-confidence favorite-store saving` |
| `milk-unit-swap` | 9% off, 4 SEK saved, confidence 0.86, staple match, low effort | `score: 0.47`, reason: `Low-effort staple unit-price improvement` |
| `fruit-promo-unclear-stock` | 35% off, 12 SEK saved, confidence 0.55, stockRisk 0.8, stale row | `score: 0.16`, reason: `Discount suppressed by stock and freshness risk` |
