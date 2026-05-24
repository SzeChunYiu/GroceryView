# PR typecheck rescue notes

## Scope audited

- Queried open PRs with `status:failure` in `SzeChunYiu/GroceryView` while rescuing ticket #1568.
- Recent failing candidates surfaced by GitHub search: #2014, #1761, #1608, #1640, #1660, #1575, #1574, #1377.
- Newer PRs at the time of audit were still queued, so they did not have actionable `tsc` failures yet.

## Common TypeScript failure patterns to fix first

1. **Missing exported modules from ticket-scoped files**
   - Symptom: `TS2307: Cannot find module ...` after a page imports a newly named component or helper.
   - Fix: add the named file, export the symbol from the package entry point if consumers import through a package barrel, and keep imports extension-compatible with the repo's ESM convention.

2. **Narrow fixture objects passed to shared connector types**
   - Symptom: object literals with extra retail-specific fields fail assignment to a stricter connector type.
   - Fix: keep the public row type explicit, put source-specific raw fields behind `unknown` parser candidates, and normalize into the exported row shape.

3. **Optional metadata access in UI cards**
   - Symptom: `TS2532` or `TS18048` from accessing optional chart, image, or metadata fields.
   - Fix: use optional chaining and fallback labels for unavailable sparkline, image, or source metadata.

4. **Functional database indexes in Prisma schema changes**
   - Symptom: Prisma schema validation fails when attempting to model expression/GiST indexes directly.
   - Fix: keep expression indexes in SQL migrations and document the reason in `schema.prisma` with a plain `//` comment, not a Prisma doc comment attached to the next model.

## Rescue checklist

For each PR with a completed failing CI run whose failing job is `tsc`/typecheck:

1. Check out the PR branch.
2. Reproduce the typecheck locally when allowed by the ticket instructions.
3. Apply the smallest type-only fix.
4. Push to the PR branch and wait for CI to re-run.
5. Record the failure class above if it was new.

This ticket run skipped local typecheck execution because the queue instruction for this worker says CI runs tests/typecheck.
