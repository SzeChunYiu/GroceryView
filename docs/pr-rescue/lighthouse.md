# PR rescue: Lighthouse and performance budgets

Use this note when triaging GroceryView PRs that fail the Lighthouse Preview job or a local LHCI performance budget. Keep each rescue push scoped to the failing PR branch; do not relax budgets as a substitute for fixing an avoidable regression.

## Rescue loop

1. Open the failing Lighthouse artifact or check log and record the route plus assertion that failed: performance score, Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), Total Blocking Time (TBT), or total byte weight.
2. Compare the failing PR diff with `origin/main` and identify the most likely cause before editing. Prefer reverting or narrowing the PR's new expensive work over changing shared budgets.
3. Apply the smallest branch-local fix: defer non-critical client work, add stable dimensions or skeleton space, reduce shipped data, or lazy-load below-the-fold modules.
4. Push the repaired PR branch and let CI rerun. Do not run the local monorepo typecheck/build/test on the shared node for this rescue.
5. If the regression is a deliberate product tradeoff that still exceeds the existing budget after the smallest fix, document the route, failing metric, before/after values, and rationale in the PR instead of unilaterally changing `.lighthouserc.json` or `apps/web/lighthouserc*.cjs`.

## Metric triage

- **LCP**: usually regresses when the hero path waits on new client data, large images, or heavy above-the-fold components. Prefer server-rendered critical text, optimized image sizing, and deferring optional widgets.
- **CLS**: usually points to late-loading banners, cards, maps, ads, or images without reserved dimensions. Reserve layout space or keep placeholders the same size as loaded content.
- **TBT**: usually comes from new client bundles, synchronous parsing, map/chart initialization, or expensive effects. Split below-the-fold code and move one-time calculations out of render paths.
- **Total byte weight**: check for large JSON fixtures, unbounded result sets, icons, images, or bundled libraries added to the route. Trim payloads and avoid adding dependencies for a rescue fix.
- **Performance score only**: inspect the detailed numeric audits first; the score is a symptom, not enough evidence by itself.

## Budget-change bar

Budget edits require explicit evidence that the product requirement changed and that route-level optimization is exhausted. A valid budget note names the affected route, the exact assertion, the old and proposed threshold, current measured values from CI artifacts, and why the extra cost is intentional.
