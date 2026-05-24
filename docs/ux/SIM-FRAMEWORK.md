# UX simulation framework

The UX simulator runs synthetic personas through task scripts and records a friction log for each persona × task. It is designed for LLM-assisted review, but the runner only needs a Playwright-like page adapter so tests can run with real Playwright or a fixture page.

## Concepts

- **Persona**: goals, constraints, locale, device, and accessibility notes for a synthetic user.
- **Task script**: ordered steps such as navigate, click, search, expect text, and note.
- **Runner**: executes each persona × task, captures page URL, step status, and persona notes.
- **Friction log**: structured notes such as “I couldn't find the country switcher” or “this label is ambiguous”, tied to a selector and task step when available.

## Output

Each run returns:

```json
{
  "personaId": "budget-parent-se",
  "taskId": "find-cheapest-milk",
  "status": "completed",
  "friction": [
    { "severity": "medium", "note": "Country switcher label is ambiguous", "stepId": "choose-country" }
  ]
}
```

## Privacy and safety

Synthetic personas must not include real user PII. Notes are product feedback only and should not be mixed with analytics identities or production session IDs.
