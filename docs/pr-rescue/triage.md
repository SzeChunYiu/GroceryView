# PR rescue triage

Run `scripts/triage-prs.ts` to scan every open pull request on `SzeChunYiu/GroceryView` and write a JSONL queue to `triage.jsonl`.

Each line contains:

- `checksStatus`: `pass`, `fail`, or `pending`
- `mergeConflicts`: boolean conflict signal from GitHub mergeability
- `stalenessDays`: days since the head commit was pushed
- `authorType`: `bot` or `human`
- `failedChecks`: failed check names plus the conclusion and GitHub-provided summary/title when present

Use `GITHUB_TOKEN` for authenticated API access and `TRIAGE_OUTPUT=path/to/triage.jsonl` to override the output path.
