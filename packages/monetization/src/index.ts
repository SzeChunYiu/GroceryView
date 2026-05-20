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

export type AdDeliveryCandidate = {
  surface: AdSurface;
  provider: AdProvider;
  userTier: UserTier;
  label?: string;
  organicRankingSeparated: boolean;
  affectsDealScore: boolean;
};

export type AdDeliveryComplianceReport = {
  status: 'compliant' | 'blocked';
  allowed: AdDeliveryCandidate[];
  blocked: Array<{ candidate: AdDeliveryCandidate; reasons: string[] }>;
  summary: string;
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

export function buildAdDeliveryComplianceReport(candidates: AdDeliveryCandidate[]): AdDeliveryComplianceReport {
  const allowed: AdDeliveryCandidate[] = [];
  const blocked: AdDeliveryComplianceReport['blocked'] = [];
  const criticalSurfaces: AdSurface[] = ['deal_score', 'checkout_decision', 'basket_optimizer'];

  for (const candidate of candidates) {
    const reasons: string[] = [];
    if (candidate.userTier === 'premium') reasons.push('premium_users_must_not_receive_ads');
    if (criticalSurfaces.includes(candidate.surface)) reasons.push(`ad_surface_blocked:${candidate.surface}`);
    if (candidate.label !== 'Sponsored') reasons.push('sponsored_label_required');
    if (!candidate.organicRankingSeparated) reasons.push('organic_ranking_separation_required');
    if (candidate.affectsDealScore) reasons.push('deal_score_must_not_be_affected');

    if (reasons.length === 0) allowed.push(candidate);
    else blocked.push({ candidate, reasons });
  }

  return {
    status: blocked.length === 0 ? 'compliant' : 'blocked',
    allowed,
    blocked,
    summary: blocked.length === 0 ? 'Ad delivery candidates comply with GroceryView trust policy.' : 'Ad delivery is blocked until trust policy violations are fixed.'
  };
}

export type SubscriptionPlan = 'premium_monthly' | 'premium_yearly';
export type BillingWebhookEventType =
  | 'checkout_completed'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'invoice_payment_failed';

export type SubscriptionEntitlementSnapshot = {
  tier: UserTier;
  plan?: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEndsAt?: string;
  provider?: 'stripe_compatible';
  updatedAt: string;
};

export type BillingSubscriptionEventType = 'subscription.active' | 'subscription.past_due' | 'subscription.canceled';

export type BillingSubscriptionEvent = {
  provider: 'stripe_compatible';
  providerEventId: string;
  type: BillingSubscriptionEventType;
  userId: string;
  plan?: SubscriptionPlan;
  currentPeriodEndsAt?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  occurredAt: string;
};

export type BillingSubscriptionEntitlementMutation = SubscriptionEntitlementSnapshot & {
  userId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
};

export type ParseStripeCompatibleSubscriptionEventInput = {
  payload: unknown;
  receivedAt: string;
  priceIdPlanMap?: Partial<Record<string, SubscriptionPlan>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isSubscriptionPlan(value: string | undefined): value is SubscriptionPlan {
  return value === 'premium_monthly' || value === 'premium_yearly';
}

function unixSecondsToIso(value: number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return new Date(value * 1000).toISOString();
}

function firstStripePriceId(subscription: Record<string, unknown>): string | undefined {
  const items = isRecord(subscription.items) ? subscription.items : {};
  const data = Array.isArray(items.data) ? items.data : [];
  for (const item of data) {
    if (!isRecord(item)) continue;
    const price = isRecord(item.price) ? item.price : {};
    const priceId = readString(price, 'id');
    if (priceId) return priceId;
  }
  return undefined;
}

function planFromStripeSubscription(
  subscription: Record<string, unknown>,
  priceIdPlanMap: Partial<Record<string, SubscriptionPlan>>
): SubscriptionPlan | undefined {
  const metadata = isRecord(subscription.metadata) ? subscription.metadata : {};
  const metadataPlan = readString(metadata, 'plan');
  if (isSubscriptionPlan(metadataPlan)) return metadataPlan;
  const priceId = firstStripePriceId(subscription);
  return priceId ? priceIdPlanMap[priceId] : undefined;
}

function billingTypeForStripeEvent(eventType: string | undefined, status: string | undefined): BillingSubscriptionEventType | null {
  if (eventType === 'customer.subscription.deleted' || status === 'canceled') return 'subscription.canceled';
  if (eventType !== 'customer.subscription.created' && eventType !== 'customer.subscription.updated') return null;
  if (status === 'active' || status === 'trialing') return 'subscription.active';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete' || status === 'incomplete_expired') return 'subscription.past_due';
  return null;
}

export function parseStripeCompatibleSubscriptionEvent(
  input: ParseStripeCompatibleSubscriptionEventInput
): BillingSubscriptionEvent | null {
  if (Number.isNaN(Date.parse(input.receivedAt))) throw new Error('receivedAt must be an ISO date.');
  if (!isRecord(input.payload)) return null;

  const eventType = readString(input.payload, 'type');
  const data = isRecord(input.payload.data) ? input.payload.data : {};
  const subscription = isRecord(data.object) ? data.object : {};
  const billingType = billingTypeForStripeEvent(eventType, readString(subscription, 'status'));
  if (!billingType) return null;

  const metadata = isRecord(subscription.metadata) ? subscription.metadata : {};
  const userId = readString(metadata, 'userId');
  if (!userId) throw new Error('Stripe subscription metadata.userId is required.');

  const plan = planFromStripeSubscription(subscription, input.priceIdPlanMap ?? {});
  if (billingType !== 'subscription.canceled' && !plan) {
    throw new Error('Stripe subscription plan metadata or known price id is required.');
  }

  const subscriptionId = readString(subscription, 'id');
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined;
  const currentPeriodEndsAt = unixSecondsToIso(readNumber(subscription, 'current_period_end'), input.receivedAt);

  return {
    provider: 'stripe_compatible',
    providerEventId: readString(input.payload, 'id') ?? `${eventType}:${subscriptionId ?? userId}`,
    type: billingType,
    userId,
    ...(plan ? { plan } : {}),
    ...(billingType !== 'subscription.canceled' ? { currentPeriodEndsAt } : {}),
    ...(customerId ? { providerCustomerId: customerId } : {}),
    ...(subscriptionId ? { providerSubscriptionId: subscriptionId } : {}),
    occurredAt: unixSecondsToIso(readNumber(input.payload, 'created'), input.receivedAt)
  };
}

export function processBillingSubscriptionEvent(event: BillingSubscriptionEvent): BillingSubscriptionEntitlementMutation {
  const statusByEventType: Record<BillingSubscriptionEventType, SubscriptionEntitlementSnapshot['status']> = {
    'subscription.active': 'active',
    'subscription.past_due': 'past_due',
    'subscription.canceled': 'canceled'
  };
  const status = statusByEventType[event.type];

  return {
    userId: event.userId,
    tier: 'premium',
    ...(event.plan ? { plan: event.plan } : {}),
    status,
    ...(event.currentPeriodEndsAt ? { currentPeriodEndsAt: event.currentPeriodEndsAt } : {}),
    provider: event.provider,
    ...(event.providerCustomerId ? { providerCustomerId: event.providerCustomerId } : {}),
    ...(event.providerSubscriptionId ? { providerSubscriptionId: event.providerSubscriptionId } : {}),
    updatedAt: event.occurredAt
  };
}

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

export type MobilePremiumEntitlementInput = {
  userId: string;
  userTier: UserTier;
  platform: 'ios' | 'android';
  billingProviderConfigured: boolean;
  activeSubscriptionPlan?: SubscriptionPlan;
  expiresAt?: string;
  now: string;
};

export type MobilePremiumEntitlementPlan = {
  userId: string;
  platform: 'ios' | 'android';
  premiumActive: boolean;
  adPlan: AdPlacementPlan;
  blockers: string[];
  actions: Array<'hide_mobile_ads' | 'show_mobile_deals_ads' | 'start_premium_checkout' | 'refresh_subscription_status' | 'restore_purchase'>;
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

export type BillingWebhookPlanInput = {
  providerName: 'stripe_compatible';
  webhookConfigured: boolean;
  signatureVerified: boolean;
  providerEventId: string;
  eventType: BillingWebhookEventType;
  userId: string;
  plan?: SubscriptionPlan;
  occurredAt: string;
  previousEventIds?: string[];
};

export type BillingWebhookPlan =
  | {
      status: 'blocked';
      reason: string;
      requiredActions: string[];
    }
  | {
      status: 'duplicate';
      providerEventId: string;
      idempotencyKey: string;
      requiredActions: ['skip_duplicate_billing_event'];
    }
  | {
      status: 'ready';
      providerEventId: string;
      idempotencyKey: string;
      subscriptionMutation: {
        userId: string;
        tier: UserTier;
        plan?: SubscriptionPlan;
        billingStatus: 'active' | 'canceled' | 'past_due';
        changedAt: string;
        reason: BillingWebhookEventType;
      };
    };

export function planBillingWebhookEvent(input: BillingWebhookPlanInput): BillingWebhookPlan {
  if (!input.webhookConfigured) {
    return {
      status: 'blocked',
      reason: 'Billing webhook endpoint is not configured.',
      requiredActions: ['billing_webhook_not_configured']
    };
  }
  if (!input.signatureVerified) {
    return {
      status: 'blocked',
      reason: 'Billing webhook signature must be verified before processing.',
      requiredActions: ['billing_webhook_signature_required']
    };
  }
  if (!input.providerEventId.trim()) throw new Error('providerEventId is required.');
  if (!input.userId.trim()) throw new Error('userId is required.');
  if (Number.isNaN(Date.parse(input.occurredAt))) throw new Error('occurredAt must be an ISO date.');

  const idempotencyKey = `${input.providerName}:${input.providerEventId}`;
  if ((input.previousEventIds ?? []).includes(input.providerEventId)) {
    return {
      status: 'duplicate',
      providerEventId: input.providerEventId,
      idempotencyKey,
      requiredActions: ['skip_duplicate_billing_event']
    };
  }

  if (input.eventType === 'checkout_completed' || input.eventType === 'subscription_renewed') {
    if (!input.plan) throw new Error('plan is required for active subscription events.');
    return {
      status: 'ready',
      providerEventId: input.providerEventId,
      idempotencyKey,
      subscriptionMutation: {
        userId: input.userId,
        tier: 'premium',
        plan: input.plan,
        billingStatus: 'active',
        changedAt: input.occurredAt,
        reason: input.eventType
      }
    };
  }

  return {
    status: 'ready',
    providerEventId: input.providerEventId,
    idempotencyKey,
    subscriptionMutation: {
      userId: input.userId,
      tier: input.eventType === 'subscription_canceled' ? 'free' : 'premium',
      plan: input.plan,
      billingStatus: input.eventType === 'subscription_canceled' ? 'canceled' : 'past_due',
      changedAt: input.occurredAt,
      reason: input.eventType
    }
  };
}
