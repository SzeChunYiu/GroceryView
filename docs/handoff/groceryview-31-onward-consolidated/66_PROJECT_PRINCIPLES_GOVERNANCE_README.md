# 66 — Project Principles Governance README

## Purpose

GroceryView needs durable principles so future versions do not drift.

Claude Code should generate and maintain living specs for:

```text
Data engineering
Database architecture
Data analytics
Metrics and semantic layer
UI/UX principles
Page specifications
Feature specifications
Content/copy standards
Ad policy
Accessibility
QA and PR review
```

## Why this matters

Without living specs, every new feature can make the product worse:

```text
more pages
more technical copy
more inconsistent cards
more untested data claims
more database load
more untracked metrics
```

The goal is:

```text
Every future feature follows the same principles.
Every page has a spec.
Every metric has a definition.
Every data source has quality checks.
Every UI component follows the design system.
Every PR proves it did not break the product.
```

## Repo docs to generate

Ask Claude Code to create:

```text
docs/principles/data-engineering.md
docs/principles/database-architecture.md
docs/principles/data-analytics.md
docs/principles/uiux-design.md
docs/principles/content-language.md
docs/principles/accessibility.md
docs/principles/ad-policy.md

docs/specs/page-spec-template.md
docs/specs/feature-spec-template.md
docs/specs/metric-definition-template.md
docs/specs/data-source-contract-template.md
docs/specs/pr-review-checklist.md

docs/analytics/metric-dictionary.md
docs/analytics/event-tracking-plan.md
docs/analytics/dashboard-roadmap.md

docs/data/source-run-contract.md
docs/data/quality-gates.md
docs/data/lineage-and-observability.md
docs/data/database-scaling-plan.md
```

## Principle

```text
A feature is not complete because it works once.
A feature is complete when it is specified, tested, measured, accessible, maintainable, and understandable.
```
