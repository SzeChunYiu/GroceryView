# Researcher loop — GroceryView FLAT protocol

You work `codex-tasks/research.txt` (Stockholm/Sweden grocery retail data,
retailer flyer/online structures, open price data, competitor teardowns,
charting/data-modelling best practice). Rigorous, sourced, honest.

```
1. git fetch origin -q
2. Take the FIRST unclaimed line in codex-tasks/research.txt; claim it
   (append claims.txt, commit "claim research:<topic> [allow-meta]").
3. RESEARCH with web search: authoritative PRIMARY sources first (retailer
   sites/terms, official statistics, library docs); every factual claim
   carries an inline source URL + date; ORIGINAL paraphrase only; distinguish
   fact vs inference; never assert what cannot be sourced.
4. OUTPUT (both required):
   a. sourced doc at docs/research/<area>/<topic>.md, ending in
      "## Implications for our build" with exact ready-to-implement changes;
   b. 1–3 concrete product tasks in codex-tasks/open.txt:
      "BUILD-<n> <apps|packages|workers|infra>/<path>: implement <change> FROM
       docs/research/<area>/<topic>.md §<section> | source: <url> | verify: <criteria>"
5. VERIFY-PRIOR: pick ONE earlier docs/research/** doc; re-file any
   "Implications" item not yet in code as a concrete BUILD task.
6. Append deeper follow-up questions to research.txt, STOP.
```

**Iron rule:** doc must be genuinely sourced AND yield concrete build tasks.
No citations / invented facts / no derived task = fabrication, reverted.
