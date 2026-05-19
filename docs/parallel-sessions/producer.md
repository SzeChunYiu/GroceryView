# Producer loop — GroceryView FLAT protocol

You ship product. Every iteration ends in a pushed, validated product PR under
`apps/ packages/ workers/ infra/`. A pane whose output is docs/reasoning is
auto-reverted by the gate.

```
1. cd <repo>; git fetch origin -q

2. SELECT — GATE-FIRST (overrides everything): if CI on main is red the ONLY
   valid work is making it green.
   Check: gh run list --workflow release-validation.yml --branch main --limit 1
   If red: fix the REAL cause, PR it, done.
   Otherwise: take the FIRST unclaimed task in codex-tasks/open.txt. If empty,
   take the highest-priority unbuilt ROADMAP.md item (P0 > P1; Phase 1 > 2 > 3).

3. LEARN — what "good" means for THIS unit:
   - web/UI: pattern leading apps (TradingView, Keepa, Flipp, Yuka, Bring!,
     Matspar, Prisjakt) use; web search if it materially improves quality.
   - API/data: correct typing, provenance, idempotent ingestion.
   - charts: TradingView Lightweight Charts best practice.
   BOUNDED (minutes); learning goes INTO code, never a standalone doc.

4. PLAN (in your head → becomes commit message): files, approach, smallest
   correct slice, how you'll validate it.

5. CLAIM (atomic, best-effort):
   echo "CLAIMED <id> by $(hostname)-$$ $(date -u +%FT%TZ)" >> codex-tasks/claims.txt
   git add codex-tasks/claims.txt && git commit -qm "claim <id> [allow-meta]" \
     && git push -q origin HEAD:main || true

6. Branch:  git checkout -B task/$(date +%s)-$$ origin/main

7. IMPLEMENT one bounded change. Honor GOAL.md domain rules (price provenance,
   distinct price types, no distance in Deal Score, no fabricated data).

8. VALIDATE:
   pnpm install (if deps changed), pnpm --filter <pkg> build, pnpm lint,
   pnpm typecheck; add/run a test; exercise the actual behavior.

9. git add -A && git commit -m "<what + why>"
10. git push origin HEAD:task/<branch>; gh pr create --base main --fill

11. PLAN-THE-NEXT (context is maximal here — do it now):
    echo "<NEW-ID> <path>: <change> | why: <what you learned> | verify: <criteria>" \
      >> codex-tasks/open.txt
    git add codex-tasks/open.txt && git commit -qm "next: +<NEW-ID> [allow-meta]"
    push to origin/main (rebase-retry; races ok, skip on fail)

12. STOP. CI + operator guard decide the merge.
```

**Done = atomic perfection + beats competitors for that unit.** No known defect,
gap, or aspect where a competitor is better may ship — queue it (step 11).

Notes:
- `gh` authenticated as SzeChunYiu. If not: `gh auth switch --user SzeChunYiu`
- Never `git reset --hard`. Branch fresh from `origin/main` each task.
- Red CI on your PR: fix on same branch, push again. Conflict: close, pick another.
