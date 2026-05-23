# Iteration 154 deliverable audit: mobile device build workflow

## Goal

Convert the existing Expo/EAS metadata into an operator-triggerable production device-build path without claiming actual app-store artifacts exist before credentials and successful EAS runs are observed.

## Delivered in this iteration

- Added `.github/workflows/mobile-device-build.yml` with manual `workflow_dispatch` platform selection for `all`, `ios`, or `android`.
- The workflow runs in the `production` environment and fails closed when `EXPO_TOKEN` is not configured.
- The workflow checks that `apps/mobile/app.config.json` and `apps/mobile/eas.json` exist before building.
- The workflow installs dependencies, runs `npm run test -w @groceryview/mobile`, runs `npm run build -w @groceryview/mobile`, then starts a non-interactive `eas-cli build --profile production --no-wait`.
- Added schema-test coverage for the manual trigger, platform choices, production environment, credential preflight, mobile verification commands, EAS command, and mobile config file dependencies.
- Updated the completion audit to record the build workflow while keeping real React Native screens, configured credentials, and observed store build artifacts as blockers.

## Files changed

- `.github/workflows/mobile-device-build.yml`
- `tests/schema/mobile-device-build-workflow.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-154-deliverable-audit.md`

## Verification

- Red TDD check first failed because `.github/workflows/mobile-device-build.yml` did not exist.
- `rtk node --test tests/schema/mobile-device-build-workflow.test.mjs` passed after adding the workflow.

## Remaining gaps

- This is an EAS build trigger, not proof that iOS/Android binaries have been built, submitted, or accepted.
- Real React Native component screens, Expo credentials, app-store credentials, observed EAS build links/artifacts, and device screenshots remain missing.
- Full GroceryView production readiness remains blocked by the broader hosted deployment, database, data coverage, provider-credential, and live smoke gaps in `docs/status/completion-audit.md`.
