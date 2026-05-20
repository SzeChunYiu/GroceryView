# GOAL — GroceryView

Updated: 2026-05-20 15:30 by billy (operator)

## Sprint target (≤7 days)

Ship a **visibly populated Stockholm grocery price terminal** at
`https://grocery-web-mu.vercel.app/`. The live homepage must surface, at a
minimum, **every store and product fixture already produced by the swarm** —
not the Next.js scaffold seed. Each iteration must measurably grow what an
unauthenticated visitor sees on `/`.

The previous infrastructure goals (catalog coverage, ingestion connectors, API
surface, DB schema) still hold as regression bars but **stop counting as
sprint progress** unless they also reach the user-visible artifact this
iteration. See [Visible Artifact](#visible-artifact) below for the gate.

## Acceptance test (executable)

```bash
# 1. driver file is not the scaffold stub — must declare ≥6 stores and ≥10 products
NPROD=$(grep -c "^\s*slug: '" apps/web/src/lib/demo-data.ts)
NSTORE=$(grep -c "name: '[A-Z]" apps/web/src/lib/demo-data.ts)
[ "$NPROD" -ge 10 ] && [ "$NSTORE" -ge 6 ]

# 2. prod URL serves the same store/product slugs from the driver file
LIVE=$(curl -sL https://grocery-web-mu.vercel.app/)
for s in willys-odenplan ica-nara-sergels-torg coop-swedenborgsgatan lidl-sveavagen; do
  echo "$LIVE" | grep -q "$s" || { echo "missing: $s on prod"; exit 1; }
done

# 3. every store in packages/ingestion fixtures is mirrored in the driver file
INGESTION_STORES=$(grep -oE "storeName: '[^']+'" packages/ingestion/src/index.ts | sort -u)
for s in $INGESTION_STORES; do grep -qF "$s" apps/web/src/lib/demo-data.ts; done
```

## Visible Artifact

The live site at `https://grocery-web-mu.vercel.app/` renders from:

- **Driver files (commits MUST grow these or `wire:` to these):**
  - `apps/web/src/lib/demo-data.ts` — stores, products, categories shown on `/`
  - `apps/web/src/components/sample-data.ts` — basket / household / privacy demo
  - `apps/web/src/components/market-shell.tsx` — the JSX that renders the
    driver-file data
- **Driver routes:** `apps/web/src/app/**/page.tsx` (in particular `page.tsx`,
  `products/[slug]/page.tsx`, `stores/[slug]/page.tsx`)
- **Prod URL:** `https://grocery-web-mu.vercel.app/`
- **Live count gate (acceptance test #2 above):** at least 6 distinct store
  slugs and 10 distinct product slugs visible in the rendered HTML.

**Worker rule:** an iteration that adds fixtures to `packages/ingestion`,
`packages/catalog`, `apps/api` etc. WITHOUT also adding a row to a driver
file is REJECTED by the MANAGER as infrastructure-only. The same iteration
must either (a) bump a driver file, OR (b) be an explicit `wire:` PR titled
`wire: surface <X> to homepage` linking the new fixture to a driver file.

## Product source paths (commits must touch ≥1 of these)

- `apps/web/`
- `apps/api/`
- `apps/mobile/`
- `packages/catalog/`
- `packages/ingestion/`
- `packages/server/`
- `packages/api/`
- `packages/db/`
- `packages/scanning/`
- `packages/ops/`
- `packages/monetization/`
- `packages/notifications/`
- `packages/auth/`
- `packages/core/`

## Non-product paths (commits touching ONLY these are REVERTED by managers)

- `docs/`, `codex-tasks/`, `change_log/`, `reports/`, `deploy/`

## Banned iteration types

- queue-refresh, planner-audit-without-source-diff, validator-policy-refresh,
  manager-review-without-rejection-or-accept, docs-only-handoff,
  status-summary-as-deliverable
- **NEW:** infrastructure-only iterations that do not reach a driver file (see
  Visible Artifact above)

## Updated by operator only

The CEO MUST NOT edit this file. Only the operator (user or main Claude Code
session) updates `GOAL.md`. CEO requests new goals via
`[CEO->OPERATOR NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
