export type PremiumEntitlementFeature = 'premium_ocr_history' | 'advanced_forecasts' | 'unlimited_alerts' | 'exports';

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
};

export const premiumEntitlementCatalog: PremiumEntitlementGate[] = [
  {
    feature: 'premium_ocr_history',
    label: 'Premium OCR history',
    freeLimit: 'Process a current scan without storing historical OCR corrections.',
    premiumAccess: 'Save scan history, retailer aliases, and corrected receipt rows.',
    enforcementReason: 'premium_ocr_history_requires_active_subscription',
  },
  {
    feature: 'advanced_forecasts',
    label: 'Advanced forecasts',
    freeLimit: 'Show the public savings explanation without account-specific forecasts.',
    premiumAccess: 'Unlock account-specific monthly savings and basket forecast drivers.',
    enforcementReason: 'advanced_forecasts_require_premium_entitlement',
  },
  {
    feature: 'unlimited_alerts',
    label: 'Unlimited alerts',
    freeLimit: 'Limit active price and stock alerts to the free account cap.',
    premiumAccess: 'Allow unlimited watched products, best-time alerts, and deal monitoring.',
    enforcementReason: 'unlimited_alerts_require_premium_entitlement',
  },
  {
    feature: 'exports',
    label: 'Exports',
    freeLimit: 'Keep CSV and receipt exports locked behind account checkout.',
    premiumAccess: 'Export corrected receipts, basket history, and forecast summaries.',
    enforcementReason: 'exports_require_premium_entitlement',
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
