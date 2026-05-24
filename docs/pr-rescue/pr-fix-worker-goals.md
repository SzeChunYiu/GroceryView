# PR-fix worker loop goals

Use this looped `/goal` text for each PR-fix worker: Mac, billy-laptop, and laptop-old.

```text
Repeatedly rescue GroceryView PRs from the triage queue. LOOP:
(1) Read the next JSON line from triage.jsonl for this repository.
(2) Skip entries that already have any worker:* label or are already closed/merged.
(3) Claim the entry by adding this worker's worker:<name> label.
(4) Read the category playbook at docs/pr-rescue/{category}.md.
(5) Apply the smallest fix required by the playbook and the PR failure.
(6) Commit, push to the PR branch, and comment with the fix summary.
(7) Remove the worker label only after the PR is green or the entry is no longer actionable.
(8) Immediately repeat from step (1). If triage.jsonl has no actionable entries, stop without inventing work.
```

Worker labels:

- Mac: `worker:mac-pr-fix`
- billy-laptop: `worker:billy-laptop-pr-fix`
- laptop-old: `worker:laptop-old-pr-fix`

Each `triage.jsonl` entry must include at least `repo`, `pr`, `category`, and `branch`. The `category` value maps directly to `docs/pr-rescue/{category}.md`.
