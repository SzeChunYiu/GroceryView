# 02 — Task A: Close Registries and Tests

## Task
Make the registry and gap files match the actual implementation after PR #3765.

## Scope
```text
docs/roadmap/atomic-gap-registry.md
docs/roadmap/feature-implementation-registry.md
apps/web/scripts/atomic-gap-registry.test.mjs
apps/web/scripts/feature-implementation-registry.test.mjs
apps/web/scripts/content-copy-audit.test.mjs
apps/web/scripts/metric-definitions.test.mjs
```

## Do
1. Read the atomic gap registry.
2. Verify which remaining gaps are actually fixed in code.
3. If fixed, mark them `done` with evidence.
4. If not fixed, leave them `open`.
5. Ensure feature implementation registry has no false claims.
6. Add tests that verify summary counts match actual statuses.

## Do not
Do not implement new UI components. Do not close a gap without test evidence.

## Tests
```bash
npm run test -w @groceryview/web -- apps/web/scripts/atomic-gap-registry.test.mjs
npm run test -w @groceryview/web -- apps/web/scripts/feature-implementation-registry.test.mjs
npm run test -w @groceryview/web -- apps/web/scripts/content-copy-audit.test.mjs
```

## Acceptance
Registry and gaps reflect reality; remaining open gaps are accurate.
