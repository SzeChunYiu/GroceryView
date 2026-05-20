export type UserTier = 'free' | 'premium';
export type AdProvider = 'adsense' | 'admob';
export type AdSurface = 'web_market_sidebar' | 'mobile_deals_feed' | 'deal_score' | 'checkout_decision' | 'basket_optimizer';

export type AdSlot = {
  surface: Extract<AdSurface, 'web_market_sidebar' | 'mobile_deals_feed'>;
  provider: AdProvider;
  label: 'Sponsored';
  organicRankingSeparated: boolean;
};

export type AdPlacementPlan = {
  slots: AdSlot[];
  excludedSurfaces: AdSurface[];
  affectsDealScore: false;
  reason: string;
};

export type MonetizationProviderHealthStatus = 'pass' | 'fail' | 'not_run';

export type MonetizationProviderReadinessInput = {
  requiredAdProviders: AdProvider[];
  requiredSubscriptionPlans: SubscriptionPlan[];
  adProviders: Array<{
    provider: AdProvider;
    configured: boolean;
    credentialsPresent: boolean;
    healthStatus: MonetizationProviderHealthStatus;
  }>;
  billingProvider: {
    providerName: 'stripe_compatible';
    configured: boolean;
    credentialsPresent: boolean;
    webhookConfigured: boolean;
    healthStatus: MonetizationProviderHealthStatus;
    priceIds: Partial<Record<SubscriptionPlan, string>>;
  };
};

export type MonetizationProviderReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

function addProviderHealthEvidence(input: {
  healthStatus: MonetizationProviderHealthStatus | undefined;
  passEvidence: string;
  failedBlocker: string;
  notRunBlocker: string;
  blockers: string[];
  evidence: string[];
}): void {
  if (input.healthStatus === 'pass') {
    input.evidence.push(input.passEvidence);
  } else if (input.healthStatus === 'fail') {
    input.blockers.push(input.failedBlocker);
  } else {
    input.blockers.push(input.notRunBlocker);
  }
}

export function buildMonetizationProviderReadinessReport(
  input: MonetizationProviderReadinessInput
): MonetizationProviderReadinessReport {
  const blockers: string[] = [];
  const evidence: string[] = [];
  const warnings: string[] = [];
  const adProvidersByName = new Map(input.adProviders.map((provider) => [provider.provider, provider]));

  for (const providerName of input.requiredAdProviders) {
    const provider = adProvidersByName.get(providerName);
    if (!provider?.configured) {
      blockers.push(`ad_provider_not_configured:${providerName}`);
    } else {
      evidence.push(`ad_provider_configured:${providerName}`);
    }

    if (!provider?.credentialsPresent) {
      blockers.push(`ad_provider_credentials_missing:${providerName}`);
    } else {
      evidence.push(`ad_provider_credentials_present:${providerName}`);
    }

    addProviderHealthEvidence({
      healthStatus: provider?.healthStatus,
      passEvidence: `ad_provider_health_pass:${providerName}`,
      failedBlocker: `ad_provider_health_failed:${providerName}`,
      notRunBlocker: `ad_provider_health_not_run:${providerName}`,
      blockers,
      evidence
    });
  }

  const billingProviderName = input.billingProvider.providerName;
  if (!input.billingProvider.configured) {
    blockers.push(`billing_provider_not_configured:${billingProviderName}`);
  } else {
    evidence.push(`billing_provider_configured:${billingProviderName}`);
  }

  if (!input.billingProvider.credentialsPresent) {
    blockers.push(`billing_provider_credentials_missing:${billingProviderName}`);
  } else {
    evidence.push(`billing_provider_credentials_present:${billingProviderName}`);
  }

  if (!input.billingProvider.webhookConfigured) {
    blockers.push(`billing_webhook_not_configured:${billingProviderName}`);
  } else {
    evidence.push(`billing_webhook_configured:${billingProviderName}`);
  }

  addProviderHealthEvidence({
    healthStatus: input.billingProvider.healthStatus,
    passEvidence: `billing_provider_health_pass:${billingProviderName}`,
    failedBlocker: `billing_provider_health_failed:${billingProviderName}`,
    notRunBlocker: `billing_provider_health_not_run:${billingProviderName}`,
    blockers,
    evidence
  });

  for (const plan of input.requiredSubscriptionPlans) {
    if (input.billingProvider.priceIds[plan]) {
      evidence.push(`billing_price_present:${plan}`);
    } else {
      blockers.push(`billing_price_missing:${plan}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    warnings,
    summary: blockers.length === 0 ? 'Monetization providers are ready.' : 'Monetization provider readiness is blocked.'
  };
}

export function buildAdPlacementPlan(input: { userTier: UserTier; configuredProviders: AdProvider[] }): AdPlacementPlan {
  const excludedSurfaces: AdSurface[] = ['deal_score', 'checkout_decision', 'basket_optimizer'];
  if (input.userTier === 'premium') {
    return {
      slots: [],
      excludedSurfaces,
      affectsDealScore: false,
      reason: 'Premium subscription removes ads.'
    };
  }

  const slots: AdSlot[] = [];
  if (input.configuredProviders.includes('adsense')) {
    slots.push({ surface: 'web_market_sidebar', provider: 'adsense', label: 'Sponsored', organicRankingSeparated: true });
  }
  if (input.configuredProviders.includes('admob')) {
    slots.push({ surface: 'mobile_deals_feed', provider: 'admob', label: 'Sponsored', organicRankingSeparated: true });
  }

  return {
    slots,
    excludedSurfaces,
    affectsDealScore: false,
    reason: slots.length > 0 ? 'Ads are allowed only in labeled non-critical surfaces.' : 'No ad providers configured.'
  };
}

export type SubscriptionPlan = 'premium_monthly' | 'premium_yearly';

export type SubscriptionEntitlementSnapshot = {
  tier: UserTier;
  plan?: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEndsAt?: string;
  provider?: 'stripe_compatible';
  updatedAt: string;
};

export type SubscriptionAccessPolicy = {
  userTier: UserTier;
  premiumFeaturesEnabled: boolean;
  adsRemoved: boolean;
  checkoutRequired: boolean;
  enforcementReasons: string[];
  accountActions: Array<'show_upgrade' | 'show_renew' | 'show_billing_issue' | 'show_manage_subscription'>;
  summary: string;
};

function buildFreeAccessPolicy(input: {
  reason: string;
  accountAction: SubscriptionAccessPolicy['accountActions'][number];
  summary?: string;
}): SubscriptionAccessPolicy {
  return {
    userTier: 'free',
    premiumFeaturesEnabled: false,
    adsRemoved: false,
    checkoutRequired: true,
    enforcementReasons: [input.reason],
    accountActions: [input.accountAction],
    summary: input.summary ?? 'Free tier access is enforced.'
  };
}

function periodHasExpired(periodEnd: string | undefined, now: string): boolean {
  if (!periodEnd) return false;
  const periodEndMs = Date.parse(periodEnd);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(periodEndMs) || !Number.isFinite(nowMs)) return true;
  return periodEndMs < nowMs;
}

export function buildSubscriptionAccessPolicy(input: {
  entitlement?: SubscriptionEntitlementSnapshot | null;
  now: string;
}): SubscriptionAccessPolicy {
  const entitlement = input.entitlement;
  if (!entitlement) {
    return buildFreeAccessPolicy({
      reason: 'missing_subscription_entitlement',
      accountAction: 'show_upgrade',
      summary: 'Free tier: no active subscription entitlement.'
    });
  }

  if (entitlement.tier !== 'premium') {
    return buildFreeAccessPolicy({
      reason: `subscription_tier_not_premium:${entitlement.tier}`,
      accountAction: 'show_upgrade'
    });
  }

  if (entitlement.status !== 'active') {
    return buildFreeAccessPolicy({
      reason: `subscription_status_not_active:${entitlement.status}`,
      accountAction: entitlement.status === 'past_due' ? 'show_billing_issue' : 'show_renew'
    });
  }

  if (periodHasExpired(entitlement.currentPeriodEndsAt, input.now)) {
    return buildFreeAccessPolicy({
      reason: `subscription_period_expired:${entitlement.plan ?? 'unknown_plan'}`,
      accountAction: 'show_renew'
    });
  }

  return {
    userTier: 'premium',
    premiumFeaturesEnabled: true,
    adsRemoved: true,
    checkoutRequired: false,
    enforcementReasons: [`active_subscription_entitlement:${entitlement.plan ?? 'unknown_plan'}`],
    accountActions: ['show_manage_subscription'],
    summary: 'Premium access is active.'
  };
}

export type SubscriptionCheckoutInput = {
  userId: string;
  plan: SubscriptionPlan;
  billingProviderConfigured: boolean;
  providerPriceId?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type SubscriptionCheckoutPlan =
  | {
      status: 'blocked_missing_provider';
      reason: string;
    }
  | {
      status: 'ready';
      provider: 'stripe_compatible';
      checkoutRequest: {
        customerReference: string;
        priceId: string;
        successUrl: string;
        cancelUrl: string;
        metadata: { plan: SubscriptionPlan };
      };
    };

export function buildSubscriptionCheckoutPlan(input: SubscriptionCheckoutInput): SubscriptionCheckoutPlan {
  if (!input.billingProviderConfigured || !input.providerPriceId || !input.successUrl || !input.cancelUrl) {
    return {
      status: 'blocked_missing_provider',
      reason: 'Subscription checkout requires configured billing provider and price id.'
    };
  }

  return {
    status: 'ready',
    provider: 'stripe_compatible',
    checkoutRequest: {
      customerReference: input.userId,
      priceId: input.providerPriceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: { plan: input.plan }
    }
  };
}
