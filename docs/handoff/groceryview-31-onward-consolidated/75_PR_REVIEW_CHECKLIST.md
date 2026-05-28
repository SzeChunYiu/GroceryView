# 75 — PR Review Checklist

Every PR must answer these.

## Product

```text
What user problem does this solve?
What route/page/component is affected?
Is the user flow connected?
```

## UI/UX

```text
Is the copy plain?
Is there one clear primary action?
Is the page visually consistent?
Does it work on mobile?
Are previews/drawers used instead of overloading the page?
```

## Data

```text
What source/data does this depend on?
Is freshness/confidence shown?
What happens if data is missing?
Are there quality gates?
```

## Analytics

```text
Are metrics defined?
Are events tracked?
Does this affect the metric dictionary?
```

## Data engineering

```text
Does ingestion remain idempotent?
Are bad rows handled?
Does it add indexes/partitions if needed?
Does it avoid expensive public-page queries?
```

## Accessibility

```text
Keyboard usable?
Screen reader label?
Chart/table fallback?
Color not the only signal?
Focus visible?
```

## Ads

```text
No ad in sensitive pages?
No ad inside result/product/deal cards?
Ad labelled Advertisement?
No accidental click risk?
```

## Tests

```text
Route tests
Data tests
Content lint tests
Accessibility tests
Interaction tests
Performance/smoke tests
```
