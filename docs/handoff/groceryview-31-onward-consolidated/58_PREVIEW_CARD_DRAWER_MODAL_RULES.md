# 58 — Preview Card, Drawer, Popover, Modal Rules

## Pattern decision tree

Use this:

```text
Need only a tiny explanation?
→ Tooltip or inline help

Need optional extra text?
→ Details / disclosure

Need quick facts and actions?
→ Preview card

Need compare/detail while staying in current workflow?
→ Side drawer on desktop, bottom sheet on mobile

Need user to complete a focused task?
→ Modal only if interruption is justified

Need SEO/shareable deep content?
→ Full page
```

## Tooltip

Use for:

```text
confidence label explanation
freshness label explanation
unit price definition
deal score definition
chart legend help
```

Do not put buttons/links inside normal tooltips.

Tooltip content should be short:

```text
"Medium confidence: enough source rows to show, but not enough for a strong claim."
```

## Details / disclosure

Use for:

```text
why this price is shown
why no data exists
methodology summary
known limitation
```

Use when the content is useful but not essential for everyone.

## Preview card

Use when clicking or hovering a thing should reveal quick facts.

Examples:

```text
Product preview
Store preview
Category preview
Deal preview
Fuel station preview
Pharmacy OTC preview
```

A preview card should include:

```text
title
price or main value
2–4 facts
freshness/confidence
primary action
secondary action
```

## Side drawer

Use on desktop for:

```text
product quick view from search
store preview from map
category trend preview from market
deal explanation
source evidence
```

Side drawer contents:

```text
header
key facts
mini chart/table
evidence
actions
open full page
close button
```

## Bottom sheet

Use on mobile instead of side drawer.

Use for:

```text
map selected marker
search result quick view
deal explanation
watchlist alert preview
```

## Modal

Use only for:

```text
confirm destructive action
sign-in required action
set target price
save view
report data issue
```

Do not use modal for normal product preview. It interrupts the shopping flow.

## Full page

Use for:

```text
product canonical page
store canonical page
category market page
pharmacy product page
fuel station page
methodology/data sources
```
