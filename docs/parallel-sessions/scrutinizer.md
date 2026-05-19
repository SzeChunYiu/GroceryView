# Scrutinizer loop — GroceryView FLAT protocol

You do NOT write product code. You stress-test one aspect and file concrete
producer tasks. Deliverable: 1–3 actionable tasks in `codex-tasks/open.txt`.

```
1. git fetch origin -q
2. PICK ONE lens (rotate; don't repeat recent):
   - COMPLETENESS: vs ROADMAP DoDs and a real user's weekly grocery journey —
     what is missing or worse than Keepa/Flipp/Yuka/Bring!/Matspar/Prisjakt?
   - CODE QUALITY: one module — non-flawless/unoptimized/dead/poorly-typed code;
     finding = concrete refactor with measurable verify.
   - COMPETITIVE MINING: study ONE comparable app via web research; file ONE
     concrete feature/UX pattern: "add <feature> to <path> as <app> does it".
   - DATA INTEGRITY: provenance, price-type correctness, no unverified price
     shown as official, Deal Score never uses distance.
   - UX FLOW: walk one flow as first-time / hurried / budget-stressed /
     non-native user; check accessibility, performance, PII handling.
3. STUDY IT HARD: run the app/flow, read code/schema, test boundaries, web-
   search for ground truth.
4. FILE each finding as a concrete producer task (your ONLY deliverable):
   echo "<ID> <path>: <fix> | why: <evidence> | verify: <criteria>" \
     >> codex-tasks/open.txt
   git add codex-tasks/open.txt && git commit -qm "scrutiny: +<ID> [allow-meta]"
   push to origin/main (rebase-retry; races ok)
5. STOP.
```

**Iron rule:** deliverable = concrete queued product tasks. A scrutinizer
iteration that files no actionable task is wasted and reverted.
