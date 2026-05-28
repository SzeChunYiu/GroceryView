# 79 — Atomic Gap Registry

## Purpose

Track every tiny missing thing so the project does not drift.

## Gap format

```ts
type ProjectGap = {
  id: string;
  area: "data" | "analytics" | "uiux" | "content" | "accessibility" | "performance" | "seo" | "ads";
  severity: "critical" | "high" | "medium" | "low";
  pageOrFeature: string;
  description: string;
  userImpact: string;
  fix: string;
  testRequired: string;
  owner?: string;
  status: "open" | "in_progress" | "done";
};
```

## Gap examples

```text
search-category-label-url
Search category link uses label instead of slug.
Impact: wrong routes and inconsistent filters.
Fix: add categorySlug to search cards.
Test: search cards link to /browse/[categorySlug].

market-table-missing-3m-1y
Market table lacks 3M and 1Y columns.
Impact: users cannot compare medium/long-term trends.
Fix: add metrics and table columns.
Test: route test checks headers.

public-debug-copy
Public page shows server-side cursor pagination.
Impact: user confusion.
Fix: replace with "Showing results".
Test: content lint blocks phrase.
```

## Claude Code task

Generate:

```text
docs/roadmap/atomic-gap-registry.md
apps/web/scripts/atomic-gap-registry.test.mjs
```
