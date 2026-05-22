# Iteration 144 Deliverable Audit — Consent and session exchange gates

## Objective
Turn the production-authentication and privacy-compliance research findings into a real GroceryView product surface by shipping a fail-closed consent manager and a browser-side production session exchange on the login page.

## Delivered product surface
- Product PR: #941, `Add consent and session exchange gates`
- Merged at: 2026-05-22T14:12:05Z
- Merge commit: `3f63ef6135074a6ba2bc07c463039aa573368b54`
- Main verification: `rtk git merge-base --is-ancestor 3f63ef6135074a6ba2bc07c463039aa573368b54 origin/main`

The merged product surface adds a client-side `ConsentManager` to the global web layout with denied-by-default Google Consent Mode v2 values, IAB TCF v2.2 disclosure copy, accept/reject/manage controls, and local policy-versioned audit logging. It also adds a `LoginSessionExchange` component to `/login` so a verified production auth assertion can be exchanged at `/api/auth/session` without showing mock accounts, demo sessions, or fake user data.

## Verification evidence
| Check | Command / source | Result |
| --- | --- | --- |
| TDD red | `rtk npm run test -w @groceryview/web -- --test-name-pattern="CMP|login to the production auth session exchange"` before implementation | Failed because `apps/web/src/components/consent-manager.tsx` was missing and `/login` did not render `LoginSessionExchange`. |
| Targeted route test | `rtk npm run test -w @groceryview/web -- --test-name-pattern="CMP|login to the production auth session exchange"` | Passed after the CMP and session exchange were implemented; 73 web route tests passed. |
| Diff hygiene | `rtk git diff --check` | Passed. |
| Full test suite | `rtk npm test` | Passed across core, API, auth, notifications, server, mobile, web route, ingestion, DB, and workflow suites. |
| Production build | `rm -rf apps/web/.next && rtk npm run build` | Passed and generated 259 static pages. Expected local SWC code-signing warnings were emitted, but the build exited 0. |
| Typecheck | `rtk npm run typecheck` | Passed. |
| GitHub checks | PR #941 `Test, build, and typecheck`; `Validate release-safe candidate` | Both completed successfully before merge. |
| Merge proof | `rtk gh pr view 941 --json state,mergedAt,mergeCommit,statusCheckRollup,url` plus ancestor check | PR #941 is `MERGED`; merge commit `3f63ef6135074a6ba2bc07c463039aa573368b54` is on `origin/main`. |

## Guardrails preserved
- Consent mode starts fail-closed: analytics, ad storage, ad user data, and ad personalisation are denied until a user grants optional consent.
- Consent proof is local, policy-versioned, timestamped, and re-requested when the policy version changes.
- Ad personalisation remains disabled unless both ads and personalisation consent are enabled.
- The login surface uses `/api/auth/session` and stores short-lived session values in `sessionStorage`; it does not expose a test account, mock session, demo data, or sample data.
- Private account profile access is attempted only with the bearer token returned by the production session exchange.

## Code-review graph note
The repository instructions prefer code-review-graph MCP tools before manual exploration. Those MCP tools were not available in this session, so verification used targeted file inspection and tests instead.

## Related concurrent PRs visible during this round
- PR #940 `feat(ingest): add ICA store promotions for 20 branches` was open while this audit was prepared.
- PR #939 `feat(web): add product vs usual signal` was open while this audit was prepared.

## Remaining research findings
This round shipped privacy consent gating and a production session exchange surface. Remaining research-to-product work still includes deeper authenticated account mutation UI, production runtime readiness checks, broader connector/store coverage, and any research findings not yet represented by merged product PRs.
