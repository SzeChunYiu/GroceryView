# UX simulation framework

Status: P1 UX reference.  
Ticket: factory-tickets #1914.  
Last updated: 2026-05-25.

The UX simulator runs synthetic GroceryView shoppers through Playwright task
scripts and records a friction log for every persona × task pair. The output is
not a pass/fail usability verdict; it is a structured list of observed blockers,
ambiguous labels, missing affordances, and persona notes such as "I couldn't find
the country switcher" or "this label is ambiguous".

## Inputs

- `packages/ux-sim/personas/*.ts` define user context, goals, accepted paths,
  and dealbreakers.
- `packages/ux-sim/tasks/*.ts` define the route, intent, success signals, and
  scripted Playwright steps for a job-to-be-done.
- Optional LLM narration can be layered on top of the deterministic runner, but
  runner output must always include raw Playwright observations and persona
  notes so findings remain auditable.

## Runner contract

`packages/ux-sim/runner.ts` exports `runUxSimulation`. It accepts personas,
tasks, a Playwright-compatible browser factory, and an optional base URL. For
each persona × task it:

1. Opens the task entry route.
2. Runs the task's scripted steps with the persona context.
3. Captures persona notes, step notes, URL/title snapshots, and errors.
4. Writes one `UxFrictionLogEntry` with `personaId`, `taskId`, `severity`,
   `notes`, and `evidence`.

## Friction severity

- `info`: useful observation, no task risk.
- `minor`: hesitation or ambiguous copy that can be worked around.
- `major`: task can complete only after backtracking or guessing.
- `blocker`: persona cannot complete the task.

## Output example

```json
{
  "personaId": "cross-border-shopper-no-se",
  "taskId": "switch-country-SE-to-NO",
  "severity": "major",
  "notes": [
    "I couldn't find the country switcher from the first viewport.",
    "Currency labels appeared only after opening the market menu."
  ],
  "evidence": {
    "startUrl": "/se/products?currency=NOK&origin=no-border",
    "finalUrl": "/no/products",
    "pageTitle": "GroceryView"
  }
}
```

## Operating rules

- Prefer deterministic task scripts for CI and use LLM narration only to enrich
  notes.
- Keep screenshots/traces outside git; commit only fixtures, task definitions,
  and anonymised friction logs.
- A task should expose success signals and likely ambiguity checks before the
  runner asks an LLM for qualitative commentary.
- Every report must be grouped by persona × task so product owners can identify
  whether a problem is broad or persona-specific.
