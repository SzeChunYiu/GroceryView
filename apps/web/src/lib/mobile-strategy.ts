export type MobileStrategyStatus = 'accepted' | 'deferred' | 'pending';

export type MobileStrategyEvaluation = {
  label: string;
  pwaFirst: string;
  nativeExpo: string;
  status: MobileStrategyStatus;
  evidence: string;
};

export type MobileStrategyFollowUp = {
  id: string;
  title: string;
  routeOrDriver: string;
  status: 'planned' | 'in-progress';
};

export const mobileStrategyDecision = {
  adr: 'docs/adr/ADR-007-mobile-strategy-pwa-first.md',
  decision: 'PWA-first',
  status: 'Accepted',
  decidedOn: '2026-05-25',
  summary:
    'GroceryView will ship the next mobile iteration as an installable PWA and defer a native Expo app until an App Store-only requirement appears.',
  evaluations: [
    {
      label: 'Installability',
      pwaFirst: 'Use the current Next manifest, install prompts, standalone display, and scanner/list shortcuts.',
      nativeExpo: 'Adds store packaging before the core grocery trip flows need native distribution.',
      status: 'accepted',
      evidence: 'apps/web/src/app/manifest.ts and apps/web/src/components/pwa-install.tsx'
    },
    {
      label: 'Web push',
      pwaFirst: 'Continue the existing browser Push API consent and subscription path, then harden channel guardrails.',
      nativeExpo: 'Would require a second notification stack and platform credentials before feature parity.',
      status: 'pending',
      evidence: 'apps/web/src/lib/push.ts'
    },
    {
      label: 'Barcode scan',
      pwaFirst: 'Keep getUserMedia and BarcodeDetector-style browser scanning on the scanner route.',
      nativeExpo: 'Could improve camera control later, but current barcode handoff already works in the web surface.',
      status: 'accepted',
      evidence: 'apps/web/src/app/scanner/page.tsx and apps/web/src/components/barcode-scanner.tsx'
    },
    {
      label: 'Code reuse',
      pwaFirst: 'Reuse Next routes, data modules, SEO metadata, grocery list flows, and account UI directly.',
      nativeExpo: 'Creates a parallel navigation and component surface for the same catalogue/list/scanner workflows.',
      status: 'accepted',
      evidence: 'apps/web/src/app'
    },
    {
      label: 'App Store needs',
      pwaFirst: 'No current grocery price, list, scanner, or watchlist requirement depends on app-store-only APIs.',
      nativeExpo: 'Deferred until paid distribution, deep native integrations, or platform policy needs appear.',
      status: 'deferred',
      evidence: 'scanner, list, deals, watchlist, and notification surfaces remain web-addressable'
    },
    {
      label: 'Timeline',
      pwaFirst: 'Build from existing manifest, install, push, offline-sync, and scanner pieces without starting a second app.',
      nativeExpo: 'Adds bootstrap, store review, release signing, and duplicated QA before divergent mobile value is proven.',
      status: 'accepted',
      evidence: 'apps/web/src/app/manifest.ts, apps/web/src/lib/offline-sync.ts, apps/web/src/lib/push.ts'
    }
  ] satisfies MobileStrategyEvaluation[],
  followUps: [
    {
      id: 'pwa-manifest-install',
      title: 'Manifest and install audit for icons, shortcuts, standalone launch, and analytics labels.',
      routeOrDriver: 'apps/web/src/app/manifest.ts',
      status: 'in-progress'
    },
    {
      id: 'pwa-offline-list',
      title: 'Offline shopping list cache and edit reconciliation hardening.',
      routeOrDriver: 'apps/web/src/lib/offline-sync.ts',
      status: 'in-progress'
    },
    {
      id: 'pwa-push-guardrails',
      title: 'Push notification subscription, channel preferences, quiet hours, and failure states.',
      routeOrDriver: 'apps/web/src/lib/push.ts',
      status: 'planned'
    },
    {
      id: 'pwa-scanner-fallbacks',
      title: 'Scanner camera permission, unsupported-browser fallback, and missing-barcode handoff polish.',
      routeOrDriver: 'apps/web/src/app/scanner/page.tsx',
      status: 'planned'
    }
  ] satisfies MobileStrategyFollowUp[],
  expoRevisitTriggers: [
    'App Store distribution becomes a launch requirement.',
    'Scanner quality requires native camera APIs that the supported browser set cannot provide.',
    'Background tasks, widgets, or platform integrations become core grocery trip requirements.'
  ]
} as const;
