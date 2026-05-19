# Parallel Sessions — FLAT Protocol (GroceryView)

This protocol replaces the CEO/MANAGER/VALIDATOR/REVIEWER model. That model
produced an 80+ PR audit loop on this repo (`docs(db): audit …`,
`feat(api): wire shared response contracts`) while `apps/ packages/ workers/
infra/` stayed **empty**. No hierarchy, no managers, no CEO.

**There are exactly TWO flat worker types. Look at your `/goal` role label:**

- **SCRUTINIZER** — label contains REVIEW, CRITIC, VERIFY, QA, RESEARCH, or
  AUDIT. You do **not** write product code. You stress-test one aspect deeply
  and file concrete defects/improvements as queue tasks. Run the
  **Scrutinizer loop**.
- **PRODUCER** — every other label (frontend-web, backend-api, db-schema,
  mobile, data-worker, product, meta, MANAGER, CEO — all map here; ignore the
  hierarchy the old label implied). You ship product. Run the **Worker loop**.

Nobody accepts/rejects others' work or coordinates anyone. The merge decision
is automatic. A PR merges iff:
1. it changes a real product path (`apps/ packages/ workers/ infra/`), and
2. the required GitHub check **`Validate release-safe candidate`** is green.

Enforced by GitHub (branch protection + required CI) + the operator auto-close
guard. No human acceptance step. Producers don't review each other.
Scrutinizers don't gatekeep — they feed the queue. Nobody writes
status/handoff/audit files; the hook and guard auto-reject zero-product noise.

## Required reading each iteration — ONLY these

Read **this file**, **`codex-tasks/open.txt`**, and **`ROADMAP.md`** (the
authoritative work breakdown; each item has a "Definition of done" — build to
it). Open your task's source files as needed. Do NOT read other board/plan
docs — that context tax is what made the old model slower than one session.

## The worker loop — SELECT, build, then PLAN-THE-NEXT (autonomous)

Deep "what is most valuable next" thinking happens at the END (step 11), when
context is maximal, and is written into the queue so the next pane inherits
it. At the START do only a cheap SELECT.

```
1. cd <repo checkout>; git fetch origin -q

2. SELECT — cheap.
   GATE-FIRST RULE (overrides everything): a red required CI on `main` blocks
   EVERY PR — if it is red, the ONLY valid work in the whole fleet is making
   it green. Check: `gh run list --workflow release-validation.yml --branch
   main --limit 1` (or take any `P0-GATE-RED` task at the top of the queue).
   If red: reproduce the failing step locally (`pnpm install && pnpm build &&
   pnpm lint && pnpm typecheck`, or the specific failing filter), fix the REAL
   cause (a stale test pinning something the fleet legitimately changed → fix
   the test to match; never revert good product code to satisfy a brittle
   test), PR it, done. No other task while the gate is red.
   Otherwise: take the FIRST unclaimed task in codex-tasks/open.txt (already
   reasoned out by a prior step 11 or a Scrutinizer — trust it). If the queue
   is empty/stale, take the highest-priority unbuilt `ROADMAP.md` item (P0
   before P1; Phase 1 before 2 before 3). Exactly ONE bounded unit.

3. LEARN — acquire the skill to do THIS unit excellently, not generically.
   If the task references a doc/path/ROADMAP item, open and implement
   faithfully from it. Then learn what "good" means for this unit:
     - web/UI: the pattern leading apps (TradingView, Keepa, Flipp, Yuka,
       Bring!, Matspar, Prisjakt) use for this interaction;
     - API/data modelling: correct typing, provenance, idempotent ingestion;
     - charts: TradingView Lightweight Charts best practice;
     - any domain: the correct current approach — don't guess from memory.
   Use web search/docs when it materially improves quality. BOUNDED (minutes);
   what you learn goes INTO the code/tests, never a standalone notes doc.

4. PLAN — in your head (it becomes the commit message, not a doc): which
   files, the approach from step 3, the smallest correct slice, how you will
   validate it. If large, cut to the smallest shippable increment.

5. CLAIM so peers don't duplicate (atomic, best-effort, never block):
     echo "CLAIMED <id> by $(hostname)-$$ $(date -u +%FT%TZ)" >> codex-tasks/claims.txt
     git add codex-tasks/claims.txt && git commit -qm "claim <id> [allow-meta]" \
       && git push -q origin HEAD:main || true     # race? pick another unit

6. Branch from latest main:  git checkout -B task/$(date +%s)-$$ origin/main
7. IMPLEMENT one bounded product change under apps/ packages/ workers/ infra/,
   applying step 3. Only the files the plan needs. Honor the Domain rules in
   GOAL.md (price provenance, distinct price types, no distance in Deal Score,
   no fabricated data-source/partnership claims).

8. VALIDATE & TEST — prove it works, not just compiles:
     - `pnpm install` (if deps changed), `pnpm --filter <pkg> build`,
       `pnpm lint`, `pnpm typecheck` (exit 0); format changed files;
     - add/extend the relevant test for new behavior and run it;
     - exercise the actual behavior: web route renders, API route responds,
       migration applies, Dagster asset materializes — whatever this unit is.
       A change that wasn't exercised is not done.

9. git add -A && git commit -m "<what changed + the why from your plan>"
10. git push origin HEAD:task/<branch>; gh pr create --base main --head task/<branch> --fill

11. PLAN-THE-NEXT — the high-judgement step, done HERE (context maximal). The
    single most valuable next unit: the next ROADMAP DoD increment AND "what
    ELSE does GroceryView need / what makes it genuinely better / beats
    Keepa/Flipp/TradingView-for-groceries harder". Hand ONE concrete unit to
    the next pane:
      echo "<NEW-ID> <product/path>: <specific next change> | why: <what you just learned> | verify: <criteria>" >> codex-tasks/open.txt
      git add codex-tasks/open.txt && git commit -qm "next: +<NEW-ID> [allow-meta]"
      # rebase-retry push to origin/main; races are fine, skip on fail
    Exactly ONE concrete product-scoped next task. Skip only if an equivalent
    already sits in the queue.

12. STOP. Do NOT self-merge, do NOT wait. The required CI check + operator
    guard decide the merge. The supervisor respawns you.
```

**Definition of done — ATOMIC PERFECTION + BEAT COMPETITORS:** a unit is done
only when, for its own scope, it is (a) flawless — correct, tested, optimized,
accessible, typed, no rough edge — AND (b) measurably as good as or better
than the best comparable competitor for that aspect. No KNOWN defect, gap, or
aspect where a competitor is better may ship; if you are not fixing it now it
MUST become a concrete queued task (step 11 / scrutinizer). Perfection is
reached per atom and iteratively, never by one pane polishing one PR forever.

**The iron rule:** every iteration MUST end in a pushed, validated product PR.
THINK/LEARN/PLAN are bounded preamble in service of THIS unit — never
standalone research/analysis/handoff/plan/doc files. A pane whose output is
reasoning or docs instead of a tested product PR is auto-reverted by the gate.

Notes:
- `gh` is authenticated as `SzeChunYiu` (repo owner). If it complains:
  `gh auth switch --user SzeChunYiu`.
- **Never `git reset --hard`.** Branch fresh from `origin/main` each task.
- If your PR's CI is red: fix on the same branch, push again. Genuine
  unresolvable conflict: close the PR, pick another task. Never block.
- One task = one branch = one PR. Parallel-safe (disjoint units, not boards).

## The Scrutinizer loop — critical review & research (no code; files findings)

You are a hostile critic, researcher, and product strategist driving
GroceryView to complete and excellent. You do **not** write product code.
Deliverable each iteration: 1–3 CONCRETE producer tasks appended to
`codex-tasks/open.txt`.

```
1. git fetch origin -q
2. PICK ONE lens (rotate; don't repeat recent lines):
   - COMPLETENESS & WHAT-ELSE: vs ROADMAP DoDs and a real user's weekly
     grocery journey — what is missing, and what would make it genuinely
     better than Keepa/Flipp/Yuka/Bring!/Matspar/Prisjakt?
   - CODE QUALITY: one module — specific non-flawless/unoptimized/dead/poorly
     typed code; finding = a concrete refactor with a measurable verify.
   - COMPETITIVE MINING: study ONE comparable app via web research; file ONE
     concrete feature/UX pattern: "add <feature> to <path> — as <app> does
     it, adapted | why users benefit | verify".
   - DATA INTEGRITY: provenance, price-type correctness, confidence labelling,
     no unverified price shown as official, Deal Score never uses distance.
   - UX of one real flow walked as a first-time / hurried / budget-stressed /
     non-native user; accessibility; performance; security/privacy of PII.
3. STUDY IT HARD: run the app/flow, read the code/schema, test boundaries; for
   competitive/research use web search for ground truth (don't guess).
4. FILE each finding as a concrete producer task (your ONLY deliverable):
     echo "<ID> <product/path>: <specific fix> | why: <evidence> | verify: <criteria>" >> codex-tasks/open.txt
     git add codex-tasks/open.txt && git commit -qm "scrutiny: +<ID> [allow-meta]"
     # rebase-retry push to origin/main; races are fine
5. STOP. A producer claims it next; the CI gate decides the merge.
```

**Scrutinizer iron rule:** deliverable is concrete queued product tasks —
NEVER a report/audit/notes doc, NEVER an approval/rejection, NEVER
gatekeeping. A scrutinizer iteration that files no actionable product task is
wasted and reverted, exactly like producer meta-churn.

## The Researcher loop — if your label is RESEARCH (work like a real researcher)

You work `codex-tasks/research.txt` (Stockholm/Sweden grocery retail data
sourcing, retailer flyer/online structures, open price data, competitor
teardowns, charting/data-modelling best practice). Rigorous, sourced, honest.

```
1. git fetch origin -q
2. Take the FIRST unclaimed line in codex-tasks/research.txt; claim it
   (append claims.txt, commit "claim research:<topic> [allow-meta]").
3. RESEARCH PROPERLY with web search: authoritative PRIMARY sources first
   (retailer sites/terms, official statistics, library docs); every factual
   claim carries an inline source URL + date; ORIGINAL paraphrase only;
   distinguish fact vs inference; if it cannot be sourced, do NOT assert it
   (no fabrication — especially no invented retailer APIs, data partnerships,
   or price figures).
4. OUTPUT (both required — the research→code bridge):
   a. a sourced doc at docs/research/<area>/<topic>.md, ending in
      "## Implications for our build" with exact ready-to-implement changes;
   b. 1–3 concrete product tasks into codex-tasks/open.txt that BIND the
      producer to the doc:
      "BUILD-<n> <apps|packages|workers|infra>/<path>: implement <change> FROM
       docs/research/<area>/<topic>.md §<section> | source: <url> | verify: <criteria>".
5. VERIFY-PRIOR: pick ONE earlier docs/research/** doc; for each "Implications"
   item not yet in code, re-file it as a concrete BUILD task.
6. SELF-REPLENISH: append deeper follow-up questions to research.txt, STOP.
```

**Researcher iron rule:** the doc must be genuinely sourced (real URLs, honest
uncertainty) AND yield concrete build tasks. No citations / invented facts /
no derived task = fabrication, reverted.

## Do not

- Do not adopt MANAGER/CEO coordination behavior even if your label implies it
  — that hierarchy is abolished. PRODUCERS ship; SCRUTINIZERS file findings.
- Do not write handoff records, journals, board updates, audit/status notes,
  or `wire shared response contracts`-style no-product commits.
- Do not stop/park on ambiguity. Skip an unclear task, take the next concrete
  one. Keep shipping product PRs.

## If `codex-tasks/open.txt` is empty or all claimed

Take the highest-priority unbuilt `ROADMAP.md` item (P0 before P1, Phase 1
before 2 before 3), build it to its Definition of done as one PR, stop.
Shipping a real ROADMAP increment always beats idling.
