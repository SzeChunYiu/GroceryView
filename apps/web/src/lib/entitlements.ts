export type PremiumEntitlementFeature =
  | 'advanced_alerts'
  | 'saved_views'
  | 'export_api'
  | 'household_sharing'
  | 'pro_terminal_tools'
  | 'premium_ocr_history';

export type AccountEntitlement = {
  tier: 'free' | 'premium';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
};

export type PremiumEntitlementGate = {
  feature: PremiumEntitlementFeature;
  label: string;
  freeLimit: string;
  premiumAccess: string;
  enforcementReason: string;
  status: 'available' | 'coming_soon';
};

export const premiumEntitlementCatalog: PremiumEntitlementGate[] = [
  {
    feature: 'advanced_alerts',
    label: 'Advanced alerts',
    freeLimit: 'Basic price alerts remain available with confidence and source details visible.',
    premiumAccess: 'Best-time, volatility-tuned, stock, and larger watchlist alert rules.',
    enforcementReason: 'advanced_alerts_require_active_subscription',
    status: 'available',
  },
  {
    feature: 'saved_views',
    label: 'Saved views',
    freeLimit: 'Save up to three product filter views per signed-in account.',
    premiumAccess: 'Unlimited saved product views, alert presets, and dashboard shortcuts.',
    enforcementReason: 'saved_views_require_active_subscription',
    status: 'available',
  },
  {
    feature: 'export_api',
    label: 'Export and API',
    freeLimit: 'Public pages, source coverage, confidence, privacy, and legal information stay free.',
    premiumAccess: 'CSV exports, account-owned receipt exports, and API-oriented data pulls.',
    enforcementReason: 'export_api_requires_active_subscription',
    status: 'available',
  },
  {
    feature: 'household_sharing',
    label: 'Household sharing',
    freeLimit: 'Single-account lists and core basket tools remain available.',
    premiumAccess: 'Shared household lists, roles, and collaborative basket history.',
    enforcementReason: 'household_sharing_requires_active_subscription',
    status: 'coming_soon',
  },
  {
    feature: 'pro_terminal_tools',
    label: 'Pro terminal tools',
    freeLimit: 'Core price comparison and source freshness pages stay public.',
    premiumAccess: 'Dense terminal-style analysis, exports, and saved operator workspaces.',
    enforcementReason: 'pro_terminal_tools_require_active_subscription',
    status: 'coming_soon',
  },
  {
    feature: 'premium_ocr_history',
    label: 'Premium OCR history',
    freeLimit: 'Process a current scan without storing historical OCR corrections.',
    premiumAccess: 'Save scan history, retailer aliases, and corrected receipt rows.',
    enforcementReason: 'premium_ocr_history_requires_active_subscription',
    status: 'available',
  },
];

export function hasActivePremiumEntitlement(entitlement: AccountEntitlement | null | undefined) {
  return entitlement?.tier === 'premium' && (entitlement.status === 'active' || entitlement.status === 'trialing');
}

export function resolvePremiumEntitlementGate(
  feature: PremiumEntitlementFeature,
  entitlement: AccountEntitlement | null | undefined,
) {
  const gate = premiumEntitlementCatalog.find((item) => item.feature === feature);
  const allowed = hasActivePremiumEntitlement(entitlement);

  return {
    feature,
    allowed,
    enforcementReason: allowed ? null : gate?.enforcementReason ?? 'premium_entitlement_required',
  };
}

export function resolvePremiumEntitlementGates(entitlement: AccountEntitlement | null | undefined) {
  return premiumEntitlementCatalog.map((gate) => ({
    ...gate,
    allowed: resolvePremiumEntitlementGate(gate.feature, entitlement).allowed,
  }));
}

export function entitlementFromHeaders(headers: Headers): AccountEntitlement | null {
  const tier = headers.get('x-groceryview-entitlement-tier')?.trim().toLowerCase();
  const status = headers.get('x-groceryview-entitlement-status')?.trim().toLowerCase();
  if (tier !== 'premium' && tier !== 'free') return null;
  if (status !== 'active' && status !== 'trialing' && status !== 'past_due' && status !== 'canceled') return null;
  return { tier, status };
}

export function premiumRequiredResponse(feature: PremiumEntitlementFeature, entitlement: AccountEntitlement | null | undefined) {
  const gate = resolvePremiumEntitlementGate(feature, entitlement);
  return {
    error: 'premium_entitlement_required',
    feature,
    allowed: gate.allowed,
    enforcementReason: gate.enforcementReason,
    freeTrustSurfaces: ['legal', 'privacy', 'source_confidence', 'freshness', 'core_price_comparison']
  };
}
