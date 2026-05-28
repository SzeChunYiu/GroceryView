# 78 — Versioning and Roadmap Process

## Version principle

Every feature has a maturity level.

```text
0. idea
1. spec
2. scaffold
3. connected
4. evidence-backed
5. tested
6. polished
7. measured
8. production-ready
```

## Feature registry

Create:

```text
docs/roadmap/feature-registry.md
```

Each feature:

```text
id
name
domain
maturity
owner
routes
data dependencies
metrics
open gaps
next actions
```

## Page maturity

Every page should have:

```text
page_spec_exists
data_contract_exists
copy_reviewed
uiux_reviewed
accessibility_reviewed
analytics_events_defined
tests_exist
```

## PR requirement

Every PR touching a public page must update:

```text
page spec if behavior changes
metric dictionary if metric changes
data contract if data changes
content lint if copy standard changes
tests
```

## Quarterly review

Review:

```text
UX quality
data quality
search quality
database health
analytics metrics
ad placement
accessibility
SEO
performance
```
