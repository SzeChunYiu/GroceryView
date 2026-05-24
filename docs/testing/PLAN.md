# GroceryView test plan

This plan defines what GroceryView tests, why it matters, where each check runs, and the coverage target each layer should meet. Follow-up test tickets should cite the relevant layer and add the smallest test that protects the behavior being changed.

## Goals

- Protect price trust: prices, units, deal scores, source provenance, and confidence labels must not regress silently.
- Protect shopping workflows: search, product comparison, lists, imports, and check-off state must work for real household use.
- Protect ingestion safety: connectors must fail closed on malformed retailer data and preserve source URLs, timestamps, store ids, and country/currency fields.
- Protect launch quality: core routes must remain accessible, fast enough, visually stable, and safe against common abuse.

## Layers

| Layer | What we test | Why | Where | Coverage target |
| --- | --- | --- | --- | --- |
| Unit | Pure functions, parsers, normalizers, scoring helpers, query builders, formatters. | Catches logic regressions cheaply and documents edge cases. | `packages/*/src/__tests__`, `apps/web/scripts/*.test.mjs`. | 90% of critical helpers; every new parser/scorer branch has positive, empty, and malformed fixtures. |
| Integration | API routes, ingestion connector flows with mocked fetch/DB, persistence adapters, route contracts. | Verifies modules compose correctly without depending on live retailer/network availability. | Package integration tests, server route tests, script-level route contract tests. | Every public route and ingestion connector has at least one happy-path and one fail-closed test. |
| E2E | Browser-level shopping journeys: discover product, compare price, add/import list items, check off basket, view source evidence. | Protects user-facing flows across app/router/client state boundaries. | Playwright or equivalent E2E suite in CI. | P0 journeys for home, search, product detail, screener, and list pass on desktop and mobile viewport. |
| Visual | High-value UI states: product cards, comparison rows, screener tables, list/import dialogs, empty/error/loading states. | Prevents layout regressions that make price evidence unreadable. | Story/screenshot or route screenshot checks. | Snapshot coverage for main responsive breakpoints on P0 components and routes. |
| Accessibility | Semantic headings, labels, keyboard navigation, focus order, color contrast, reduced-motion-safe loading. | Grocery workflows must be usable with assistive tech and keyboard-only navigation. | Automated axe checks plus targeted keyboard tests. | Zero serious/critical axe findings on P0 routes; keyboard path documented for dialogs and nav. |
| Performance | Route render time, bundle growth, connector fixture size, ingestion runtime, cache hit behavior. | Keeps grocery lookup fast and prevents oversized generated assets. | Lighthouse/Next build stats, script guards, CI artifact size checks. | No P0 route exceeds agreed Lighthouse budgets; generated fixtures stay below GitHub and deployment limits. |
| Security | Auth/session gates, signed share links, webhook validation, input validation, rate-limit/error behavior. | Prevents tampering, private list leakage, and unsafe ingestion inputs. | Unit/integration tests plus static checks for sensitive paths. | Every signed token, webhook, admin route, and user-controlled parser has tamper/invalid-input tests. |
| Load | Batch ingestion, API pagination, search/list endpoints under realistic concurrency. | Ensures launch traffic and scheduled jobs do not degrade core behavior. | Scheduled or pre-release load scripts with fixed fixtures. | P95 latency and error-rate budgets recorded for search, product detail data, list sharing, and ingestion jobs. |

## Test data rules

- Use small fixtures that preserve real shape, source URL, country, currency, and timestamp fields.
- Do not assert live prices from retailer websites in deterministic tests; assert parser behavior from captured fixtures.
- Prefer fail-closed expectations when retailer payloads are missing required identity, price, or provenance fields.
- Keep generated fixtures bounded so tests and repository size remain reviewable.

## CI gates

- PR CI should run unit and integration tests for changed packages plus route contract scripts for changed app routes.
- E2E, visual, accessibility, performance, security, and load suites can run as scheduled or protected-branch gates when runtime is too high for every PR.
- A failed test must identify the protected user promise: price correctness, provenance, shopping workflow, accessibility, performance, or security.

## Adding tests

1. Add a unit test beside the package when changing pure logic.
2. Add an integration test when a change crosses a route, connector, DB, or API boundary.
3. Add or update E2E/visual/a11y/perf/security/load coverage when a user-facing P0 journey or risk boundary changes.
4. Keep assertions specific to externally visible behavior and source-provenance guarantees.
