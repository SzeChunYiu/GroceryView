# Iteration 164 Deliverable Audit — Mobile Camera Capture Screens

## Objective restatement

Continue turning GroceryView into a real product by replacing scan-route placeholders with native camera capture entrypoints for barcode scanning and receipt image capture, then PR and merge the round to `main`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Native barcode camera route | `apps/mobile/app/scan/barcode.tsx` renders `MobileScanCaptureScreen mode="barcode"`; `apps/mobile/src/native/MobileScanCaptureScreen.tsx` uses `CameraView` and `onBarcodeScanned` | Implemented in this PR |
| Native receipt image capture route | `apps/mobile/app/scan/receipt.tsx` renders `MobileScanCaptureScreen mode="receipt"`; the shared capture screen calls `takePictureAsync()` and records the captured URI | Implemented in this PR |
| Expo Camera dependency | `apps/mobile/package.json` and `package-lock.json` declare `expo-camera` for `npm ci`/EAS builds | Implemented in this PR |
| Typed TSX build coverage | `apps/mobile/tsconfig.build.json` and `apps/mobile/tsconfig.test.json` include `src/**/*.tsx` with `jsx: react-jsx`; `rtk npm run build -w @groceryview/mobile` compiles native TSX | Implemented in this PR |
| Regression coverage | `tests/schema/mobile-camera-capture-screens.test.mjs` verifies dependency, TSX compile config, Expo Camera API usage, and route wiring; `tests/schema/mobile-expo-router-screens.test.mjs` accepts scan routes through the camera capture wrapper | Implemented in this PR |
| Completion audit updated | `docs/status/completion-audit.md` records native scan capture progress while keeping provider/device proof gaps explicit | Implemented in this PR |
| PR and merge to `main` | This branch/PR is the merge vehicle for the round | Pending until PR step |

## TDD evidence

- RED: `rtk node --test tests/schema/mobile-camera-capture-screens.test.mjs` failed because `apps/mobile/package.json` did not declare `expo-camera` and the native capture screen was absent.
- GREEN: `rtk node --test tests/schema/mobile-camera-capture-screens.test.mjs` passed after adding `expo-camera`, the shared native scan capture screen, and route wiring.

## Verification

- Full verification before PR: `rtk git diff --check && rtk npm ci --dry-run --ignore-scripts && rtk node --test tests/schema/mobile-camera-capture-screens.test.mjs tests/schema/mobile-expo-router-screens.test.mjs tests/schema/completion-audit.test.mjs && rtk npm run test -w @groceryview/mobile && rtk npm test && rtk npm run build && rtk npm run typecheck`

## Remaining gaps

This adds native camera entrypoints for scan routes, but GroceryView still needs object-storage credentials, hosted CORS/upload proof, OCR provider credentials, observed device capture evidence, and EAS store-build artifacts.
