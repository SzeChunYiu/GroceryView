# Bot-author PR cleanup

Use this checklist for Dependabot and Renovate pull requests during PR rescue.

## Auto-merge when green

Merge bot-authored dependency PRs without extra review when all of these are true:

- The author is Dependabot or Renovate.
- Required CI checks are green.
- The update is patch or minor, or a lockfile-only refresh.
- Release notes do not call out a breaking change, migration, dropped runtime, or security-policy change.
- The diff does not modify application code outside generated lockfiles or package manifests.

## Defer breaking changes

Defer the PR and leave it unmerged when any of these are true:

- The update is a major version bump.
- Release notes mention breaking changes, migrations, config rewrites, or removed APIs.
- CI is red, pending, missing required checks, or marked neutral for a required gate.
- The diff changes source code, build tooling, database/schema files, or deployment config beyond dependency metadata.
- The update affects runtime-critical packages such as framework, ORM, auth, payments, or database drivers.

## Rescue notes

When deferring, comment with the reason and label/queue it for manual upgrade work. Do not batch deferred breaking changes into unrelated green bot PRs.
