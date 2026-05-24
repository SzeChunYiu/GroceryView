# PR-fix worker loop goals

Use this `/goal` text for the Mac, `billy-laptop`, and `laptop-old` PR-fix workers so all rescue workers consume the same triage queue instead of racing on ad-hoc PR scans.

```text
Repeatedly rescue GroceryView PRs from the triage queue.

LOOP:
1. Read the next JSON line from triage.jsonl.
2. Skip entries whose PR already has a worker:* label or whose rescue branch is already claimed.
3. Claim the entry by adding this worker's worker:<name> label.
4. Read the category playbook in docs/pr-rescue/<category>.md before editing.
5. Apply the smallest fix for that triage entry, commit, push, and open/update the PR.
6. Mark the triage entry done, then immediately repeat from step 1.

Do not work outside the claimed triage entry. Do not append new follow-ups; leave CI to run validation.
```

Worker label mapping:

- Mac: `worker:mac-pr-fix`
- billy-laptop: `worker:billy-laptop-pr-fix`
- laptop-old: `worker:laptop-old-pr-fix`
