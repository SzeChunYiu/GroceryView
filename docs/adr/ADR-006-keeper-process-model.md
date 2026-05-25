# ADR-006: Keeper Process Model with setsid tmux and flock

- **Status:** Accepted
- **Date:** 2026-05-25
- **Owners:** GroceryView operations maintainers
- **Scope:** Long-running keeper processes, tmux launch wrappers, and lockfile discipline

## Context

GroceryView keeper jobs run on shared developer and HPC hosts where shell sessions, SSH control sockets, and tmux servers can outlive the command that started them. Previous keeper feedback identified three recurring hazards:

1. traps in wrapper scripts could exit only the parent shell while leaving a child keeper alive;
2. tmux sessions launched in the caller's process group could receive terminal/session signals unexpectedly; and
3. lockfiles checked by pathname could be replaced, leaving a stale process holding an inode that no longer matched the visible lockfile.

The keeper model needs one active process per role, predictable cleanup, and a safe way to refuse duplicate starts without relying on fragile PID files.

## Decision

Keeper launchers must start tmux under `setsid` and guard each keeper role with `flock` on an already-open file descriptor.

Required pattern:

```sh
exec 9>"$lockfile"
flock -n 9 || exit 0
setsid tmux new-session -d -s "$session" -- "$keeper_command"
```

Wrapper traps must terminate the whole child process group they created, not just the immediate shell. On `EXIT`, `INT`, or `TERM`, the wrapper should signal the recorded process group, wait for it, and tolerate already-exited children.

## Lockfile inode guardrail

Do not implement mutual exclusion by testing whether a lockfile path exists or by reading a PID from it. The lock must be the kernel `flock` held on the open file descriptor for the lifetime of the keeper. This avoids the inode hazard where another process deletes and recreates the same pathname while the original process still holds a lock on the old inode.

If operators need metadata, write it after the lock is acquired and treat it as advisory only:

```sh
printf 'pid=%s\nstarted_at=%s\n' "$$" "$(date -u +%FT%TZ)" >&9
```

The held descriptor, not that text, is the authority.

## Consequences

- Duplicate keeper starts fail closed without racing on PID-file contents.
- `setsid tmux` isolates keepers from the caller's terminal process group.
- Trap cleanup is responsible for the full spawned process group, reducing orphaned workers.
- Operators must use the standard wrapper rather than hand-launching keeper commands in arbitrary tmux panes.

## Operational checks

- A keeper wrapper must acquire `flock -n` before launching tmux.
- A restart must release the old descriptor by stopping the old keeper process group.
- Cleanup code must not `rm` and recreate lockfiles as a synchronization mechanism.
- Debugging commands may inspect lockfile contents, but they must not treat those contents as proof that a keeper is alive.
