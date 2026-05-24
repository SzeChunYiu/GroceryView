# Production deploy runbook

## Scope

Production deploys cover the Vercel web app and LUNARC ingestion jobs.

## Pre-flight checks

1. Confirm the target branch is up to date with `main` and the production PR has green CI.
2. Confirm environment variables are present in Vercel and LUNARC for API, database, and ingestion credentials.
3. Check recent ingestion health and verify there is no active backfill or migration window.
4. Confirm database migrations are backwards-compatible with the currently deployed web/API version.
5. Announce the deploy window and expected risk in the team channel.

## Vercel deploy

1. Merge the approved PR to `main`.
2. Watch the Vercel production deployment for build, install, and route-generation failures.
3. Smoke-check homepage, search, product detail, store detail, and admin health routes.
4. Verify the deployment uses the expected commit SHA.

## LUNARC ingestion deploy

1. SSH to LUNARC using the shared socket/session.
2. Pull the latest `main` in the ingestion checkout.
3. Install dependency changes only when lockfiles changed.
4. Run database migrations if the release includes ingestion schema changes.
5. Restart or resubmit scheduled ingestion jobs.
6. Check the first job log for source fetches, row counts, and write failures.

## Rollback

### Vercel

1. Promote the previous known-good deployment in Vercel.
2. Confirm web smoke checks recover.
3. Open a revert PR if the bad commit should not remain on `main`.

### LUNARC ingestion

1. Stop the failing scheduled job or Slurm submission.
2. Check out the previous known-good commit.
3. Re-run only idempotent jobs; do not replay partial writes without verifying checkpoints.
4. If a migration caused the failure, apply the documented down migration or restore from the latest verified backup.

## Common failure modes

- Missing Vercel env var: build or runtime API calls fail; add the variable and redeploy.
- Prisma/schema drift: migrations fail on LUNARC; pause ingestion and reconcile schema before retrying.
- Source API rate limit: ingestion row counts drop; back off and rerun after the source reset window.
- Broken connector parsing: ingestion writes zero rows; inspect fixture diffs and disable the connector if needed.
- Vercel performance budget failure: keep production on the previous deployment and investigate bundle or route regressions.
