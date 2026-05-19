# Parallel Sessions — FLAT Protocol (GroceryView)

**Two roles. Look at your `/goal` label:**

- **SCRUTINIZER** — label contains REVIEW, CRITIC, VERIFY, QA, AUDIT, or
  RESEARCH. Read `docs/parallel-sessions/scrutinizer.md` (or `researcher.md`).
- **PRODUCER** — every other label. Read `docs/parallel-sessions/producer.md`.

Nobody coordinates anyone. Merge is automatic: a PR lands iff it touches
`apps/ packages/ workers/ infra/` AND the required CI check is green.

**Do not** write handoff/board/audit/status files. Do not adopt MANAGER/CEO
behavior. Do not park on ambiguity — skip an unclear task, take the next one.

If `codex-tasks/open.txt` is empty: take the highest-priority unbuilt
`ROADMAP.md` item and build it to its Definition of done.
