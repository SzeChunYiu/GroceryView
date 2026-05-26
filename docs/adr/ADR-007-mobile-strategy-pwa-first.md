# ADR-007: PWA-first mobile strategy

- **Status:** Accepted
- **Date:** 2026-05-25
- **Owners:** GroceryView product and web maintainers
- **Scope:** Mobile install, scanning, offline list use, push notifications, and future native app work

## Context

GroceryView needs a mobile direction before scanner, list, deal, and notification work splits into separate web and native surfaces. The repo already has mobile-relevant web pieces:

- an installable app manifest with standalone display and grocery workflow shortcuts in `apps/web/src/app/manifest.ts`;
- install education and `beforeinstallprompt` handling in `apps/web/src/components/pwa-install.tsx`;
- an in-browser scanner route with barcode handoff and receipt upload flows in `apps/web/src/app/scanner/page.tsx`;
- browser push consent helpers in `apps/web/src/lib/push.ts`; and
- offline list reconciliation copy in `apps/web/src/lib/offline-sync.ts`.

The decision compares a PWA-first path against starting a native Expo app now.

## Decision

GroceryView will ship the next mobile iteration as a PWA-first experience and defer native Expo work.

Expo remains a valid future option, but it is not the default path until a concrete App Store, native camera, background task, widget, or platform integration requirement appears. The immediate mobile surface should improve the existing Next app, scanner route, installability, offline list behavior, and browser push path.

## Comparison

| Factor | PWA-first | Native Expo first |
| --- | --- | --- |
| Installability | Builds on the existing manifest, standalone display, install prompts, and workflow shortcuts. | Requires app packaging and release flow before the grocery trip flows need native distribution. |
| Web push | Extends the existing browser Push API subscription path and channel preferences. | Requires a second notification stack, platform credentials, and duplicated preference handling. |
| getUserMedia barcode scan | Uses the current browser camera scanner and URL barcode handoff on `/scanner`. | May offer deeper camera control later, but duplicates the scanner UI before that need is proven. |
| Code reuse | Reuses Next routes, data modules, metadata, account UI, list flows, and scanner components directly. | Creates parallel navigation, component, release, and QA surfaces for the same product workflows. |
| App Store needs | No current price, list, scanner, watchlist, or notification requirement depends on app-store-only distribution. | Useful only if store distribution, app review, or native-only capabilities become explicit requirements. |
| Timeline | Shorter because manifest, install, scanner, push, and offline list drivers already exist in the web app. | Longer because it adds bootstrap, signing, store review, native release automation, and parity work. |

## Consequences

- Mobile feature work should land in the web app first unless it meets a revisit trigger below.
- The scanner route is the visible mobile decision surface and should keep linking grocery trip flows together.
- Push and offline work must remain capability-aware: unsupported browsers should show clear fallback states rather than blocking core grocery workflows.
- Native Expo planning should not start as a parallel implementation track without a new decision record.

## Follow-up implementation work

Follow-up work is tracked in this repo rather than created as new external tickets in this change:

1. Manifest and install audit for icons, shortcuts, standalone launch, and analytics labels: `apps/web/src/app/manifest.ts`.
2. Offline shopping list cache and edit reconciliation hardening: `apps/web/src/lib/offline-sync.ts`.
3. Push notification subscription, channel preferences, quiet hours, and failure states: `apps/web/src/lib/push.ts`.
4. Scanner camera permission, unsupported-browser fallback, and missing-barcode handoff polish: `apps/web/src/app/scanner/page.tsx`.

## Revisit triggers

Reopen the Expo decision if App Store distribution becomes mandatory, browser camera support cannot meet scanner quality needs, background native tasks become central to grocery trips, or platform integrations such as widgets become part of the committed scope.
