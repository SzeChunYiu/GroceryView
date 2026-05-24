# PR-fix worker triage queue loop

Use this looped `/goal` text for the Mac, `billy-laptop`, and `laptop-old` PR-fix workers.

```text
Repeatedly fix PR-rescue entries from the triage queue. LOOP: (1) Read the next JSONL entry from triage.jsonl in order. Skip entries already claimed via any worker label. (2) Claim the entry by applying this worker label before editing. (3) Read the category playbook in docs/pr-rescue/{category}.md, then inspect only the PR/files required by that playbook and the triage entry. (4) Implement the smallest fix for the category. (5) Commit, push, and open/update the PR as directed by the category playbook. (6) Mark the triage entry done. (7) Immediately repeat from (1). If triage.jsonl has no unclaimed entries, /goal end and stop. Do NOT append follow-ups. Skip unrelated cleanup.
```

Worker labels:

- Mac: `worker:pr-fix-mac`
- billy-laptop: `worker:pr-fix-billy-laptop`
- laptop-old: `worker:pr-fix-laptop-old`

Each worker must use the category-specific playbook at `docs/pr-rescue/{category}.md` before changing code so API, frontend, CI, and docs failures stay routed through the right rescue process.
