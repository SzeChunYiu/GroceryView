# ADR-006: Keeper process model for long-running workers

- Status: Accepted
- Date: 2026-05-24
- Scope: factory keeper process supervision, tmux launch isolation, and lockfile handling

## Context

Factory workers are run by a keeper loop that must survive shell exits, avoid duplicate worker launches, and cleanly release local resources when it is stopped. Earlier keeper feedback identified three failure modes:

1. Keeper exits did not always trap `INT`, `TERM`, or `EXIT`, leaving child loops or temporary state behind.
2. Starting tmux from the keeper's current process group let terminal/session signals leak into the worker session.
3. Reusing a fixed lockfile path with `flock` can hit the lockfile-inode hazard: deleting or recreating the path while a descriptor is locked can let another process acquire a different inode and run a second keeper.

## Decision

The keeper process model uses a single-owner lock directory, explicit cleanup traps, and a detached tmux launch:

- Acquire exclusivity with `mkdir "$LOCKDIR"` rather than lockfile replacement. Directory creation is atomic on the local filesystem and avoids the stale-inode lockfile class of bugs.
- Write metadata such as `pid`, `started_at`, and `worker_label` inside the lock directory after acquisition. Metadata files are advisory only; ownership is the directory itself.
- Install `trap cleanup INT TERM EXIT` immediately after acquiring the lock. Cleanup removes only the lock directory owned by the current keeper and terminates helper children that the keeper started.
- Launch tmux through `setsid tmux new-session -d ...` so the worker session has a new session id and is isolated from the keeper's controlling terminal/process group.
- Keep worker identity explicit in the tmux session name and environment, including the worker label, repository, branch, and ticket source.

## Reference implementation

```bash
#!/usr/bin/env bash
set -euo pipefail

worker_label="worker:ticket-cn015-p29"
lock_root="${XDG_RUNTIME_DIR:-/tmp}/groceryview-factory"
lock_dir="$lock_root/keeper-${worker_label//[^a-zA-Z0-9_.-]/_}.lockdir"
session="groceryview-${worker_label//[^a-zA-Z0-9_.-]/_}"

mkdir -p "$lock_root"
if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "keeper already running for $worker_label ($lock_dir)" >&2
  exit 75
fi

cleanup() {
  status=$?
  if [[ -f "$lock_dir/pid" && "$(cat "$lock_dir/pid")" == "$$" ]]; then
    rm -rf "$lock_dir"
  fi
  exit "$status"
}
trap cleanup INT TERM EXIT

printf '%s\n' "$$" > "$lock_dir/pid"
printf '%s\n' "$(date -u +%FT%TZ)" > "$lock_dir/started_at"
printf '%s\n' "$worker_label" > "$lock_dir/worker_label"

setsid tmux new-session -d -s "$session" \
  "export WORKER_LABEL='$worker_label'; exec ./scripts/factory-worker-loop.sh"

wait
```

## Consequences

- A keeper restart cannot accidentally double-run because the atomic lock directory remains the single coordination primitive.
- Operators can inspect keeper ownership without trusting metadata as the locking mechanism.
- `setsid tmux` isolates the worker from SSH or terminal hangups that affect the keeper shell.
- Cleanup traps make normal shutdowns deterministic while still preserving a visible lock directory if the host crashes mid-run; operators should compare the recorded PID with live processes before removing a stale directory.

## Operational checklist

- Use one lock directory per worker label.
- Never `rm` and recreate a lockfile path as part of normal locking.
- Register cleanup traps before launching tmux or background workers.
- Launch tmux with `setsid` and a deterministic session name.
- Treat stale-lock cleanup as an operator action requiring PID verification.
