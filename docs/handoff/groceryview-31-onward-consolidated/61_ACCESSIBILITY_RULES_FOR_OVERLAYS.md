# 61 — Accessibility Rules for Overlays

## Tooltips

Use for non-interactive text only.

Rules:

```text
trigger has aria-describedby
tooltip uses role=tooltip
Escape dismisses
focus stays on trigger
no links/buttons inside normal tooltip
```

If the popup contains links/buttons, use a non-modal dialog/popover, not a tooltip.

## Disclosure / details

Use:

```text
button
aria-expanded
aria-controls
keyboard Enter/Space
```

## Side drawer / bottom sheet

If it has interactive controls:

```text
use dialog semantics when appropriate
clear heading
close button
focus management
Escape closes
return focus to trigger
```

## Modal

Use sparingly.

Must have:

```text
role=dialog or native dialog
aria-modal=true
labelled heading
focus trap
Escape closes unless destructive confirmation requires explicit choice
return focus
```

## Map bottom sheet

Mobile map detail should:

```text
not cover all context by default
allow drag/collapse
have close button
have accessible heading
provide list fallback
```

## Avoid hover-only content

All preview content must be reachable by:

```text
keyboard
touch
screen reader
```

Do not rely on hover alone.
