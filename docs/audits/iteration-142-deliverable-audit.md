# Iteration 142 Deliverable Audit — Structured JSON-LD metadata

## Objective
Turn the SEO/crawlability research finding into a real GroceryView product surface by adding structured metadata that search engines and rich-result parsers can consume from the public Next app.

## Delivered product surface
- Product PR: #919, `feat(seo): add structured JSON-LD metadata`
- Merged at: 2026-05-22T13:38:06Z
- Merge commit: `987c61b6f2a170566f27ac0148dd1b01131e9bd9`
- Main verification: `git merge-base --is-ancestor 987c61b6f2a170566f27ac0148dd1b01131e9bd9 origin/main`

The root layout now emits Organization and WebSite JSON-LD, including GroceryView’s production URL and a SearchAction. Product detail pages now emit Product JSON-LD with AggregateOffer bounds derived from verified chain or OpenPrices price evidence, plus BreadcrumbList JSON-LD for product/category discovery. The implementation keeps product metadata tied to verified public data rather than demo fixtures.

## Verification evidence
| Check | Command / source | Result |
| --- | --- | --- |
| TDD red | `rtk npm run test -w @groceryview/web -- --test-name-pattern="JSON-LD organization"` with implementation stashed | Failed on missing `application/ld+json` in `apps/web/src/app/layout.tsx`. |
| Targeted web contract test | `rtk npm run test -w @groceryview/web -- --test-name-pattern="JSON-LD organization"` | Passed: 67 web route tests, including JSON-LD organization, site-search, product-offer, and breadcrumb assertions. |
| Diff hygiene | `rtk git diff --check` | Passed. |
| Full test suite | `rtk npm test` | Passed across core, web route, ingestion, DB, workflow, and mobile suites. |
| Production build | `rm -rf apps/web/.next && rtk npm run build` | First run hit the known transient `.next/required-server-files.json` ENOENT; rerun passed and generated 205 static pages. SWC code-signing warnings were emitted, but the successful rerun exited 0. |
| Typecheck | `rtk npm run typecheck` | Passed. |
| GitHub checks | PR #919 `Test, build, and typecheck`; `Validate release-safe candidate` | Both completed successfully before merge. |
| Merge proof | `rtk gh pr view 919 --json state,mergedAt,mergeCommit,statusCheckRollup,url` plus ancestor check | PR #919 is `MERGED`; merge commit is on `origin/main`. |

## Guardrails preserved
- Product AggregateOffer bounds are computed from verified chain/OpenPrices price rows already rendered by the product page.
- Product JSON-LD does not import `@/lib/demo-data` or sample-data.
- Breadcrumbs use canonical product and category URLs in the public app.
- Root SearchAction points at the public GroceryView product-search route.

## Code-review graph note
The repository instructions prefer code-review-graph MCP tools before manual exploration. Those MCP tools were not available in this session, so implementation and verification used targeted file inspection and tests instead.

## Remaining research findings
This round shipped structured public metadata. Remaining research-to-product work still includes deeper authenticated runtime flows, production readiness checks, and any other research findings not yet represented by merged product PRs.
