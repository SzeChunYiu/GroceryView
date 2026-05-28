# 56 — Human-Centered Interaction Model / 以人為本

## Core principle

GroceryView should not force users to open a full page for every question.

Users need a path like this:

```text
Glance
→ Preview
→ Compare
→ Decide
→ Open full page only if needed
```

This is 以人為本: design around how people actually shop, compare, doubt, verify, and decide.

## Human needs

Users are not thinking:

```text
I want to inspect the raw observation table.
```

They are thinking:

```text
Is this cheaper?
Can I trust it?
Where can I buy it?
Is this deal real?
Should I click deeper?
```

## Interaction layers

```text
Layer 1: Page overview
Shows only the most important choices.

Layer 2: Preview cards
Quick facts without leaving the page.

Layer 3: Side drawer / bottom sheet
Detailed context while keeping the user in the same flow.

Layer 4: Full detail page
Canonical URL, SEO, shareable, deep evidence.

Layer 5: Methodology/data source page
For users who want full transparency.

Layer 6: Backstage admin/debug/logging
For maintainers only, not normal users.
```

## Frontstage vs backstage

Normal user pages should show:

```text
meaning
answer
confidence
freshness
next action
```

Backstage/admin pages should show:

```text
source_run_id
raw_record_id
parser version
connector logs
dead-letter rows
quality check payloads
query timings
pipeline run details
```

## Human-centered rule

```text
If information helps the user decide, show it.
If information helps the system operator debug, move it backstage.
If information helps both, show a short human summary with a link to evidence/admin details.
```
