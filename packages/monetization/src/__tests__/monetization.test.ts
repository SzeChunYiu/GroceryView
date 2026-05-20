import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdPlacementPlan,
  buildMonetizationProviderReadinessReport,
  buildSubscriptionAccessPolicy,
  buildSubscriptionCheckoutPlan
} from '../index.js';

describe('monetization foundation', () => {
  it('fails closed when monetization provider credentials, webhooks, or health checks are missing', () => {
    const report = buildMonetizationProviderReadinessReport({
      requiredAdProviders: ['adsense', 'admob'],
      requiredSubscriptionPlans: ['premium_monthly', 'premium_yearly'],
      adProviders: [
        { provider: 'adsense', configured: true, credentialsPresent: true, healthStatus: 'pass' },
        { provider: 'admob', configured: false, credentialsPresent: false, healthStatus: 'not_run' }
      ],
      billingProvider: {
        providerName: 'stripe_compatible',
        configured: true,
        credentialsPresent: false,
        webhookConfigured: false,
        healthStatus: 'fail',
        priceIds: { premium_monthly: 'price_monthly_123' }
      }
    });

    assert.deepEqual(report, {
      status: 'blocked',
      blockers: [
        'ad_provider_not_configured:admob',
        'ad_provider_credentials_missing:admob',
        'ad_provider_health_not_run:admob',
        'billing_provider_credentials_missing:stripe_compatible',
        'billing_webhook_not_configured:stripe_compatible',
        'billing_provider_health_failed:stripe_compatible',
        'billing_price_missing:premium_yearly'
      ],
      evidence: [
        'ad_provider_configured:adsense',
        'ad_provider_credentials_present:adsense',
        'ad_provider_health_pass:adsense',
        'billing_provider_configured:stripe_compatible',
        'billing_price_present:premium_monthly'
      ],
      warnings: [],
      summary: 'Monetization provider readiness is blocked.'
    });
  });

  it('passes only when ad and billing providers are configured, credentialed, and healthy', () => {
    const report = buildMonetizationProviderReadinessReport({
      requiredAdProviders: ['adsense', 'admob'],
      requiredSubscriptionPlans: ['premium_monthly', 'premium_yearly'],
      adProviders: [
        { provider: 'adsense', configured: true, credentialsPresent: true, healthStatus: 'pass' },
        { provider: 'admob', configured: true, credentialsPresent: true, healthStatus: 'pass' }
      ],
      billingProvider: {
        providerName: 'stripe_compatible',
        configured: true,
        credentialsPresent: true,
        webhookConfigured: true,
        healthStatus: 'pass',
        priceIds: {
          premium_monthly: 'price_monthly_123',
          premium_yearly: 'price_yearly_123'
        }
      }
    });

    assert.deepEqual(report, {
      status: 'ready',
      blockers: [],
      evidence: [
        'ad_provider_configured:adsense',
        'ad_provider_credentials_present:adsense',
        'ad_provider_health_pass:adsense',
        'ad_provider_configured:admob',
        'ad_provider_credentials_present:admob',
        'ad_provider_health_pass:admob',
        'billing_provider_configured:stripe_compatible',
        'billing_provider_credentials_present:stripe_compatible',
        'billing_webhook_configured:stripe_compatible',
        'billing_provider_health_pass:stripe_compatible',
        'billing_price_present:premium_monthly',
        'billing_price_present:premium_yearly'
      ],
      warnings: [],
      summary: 'Monetization providers are ready.'
    });
  });

  it('plans ads only in non-critical surfaces and labels provider slots', () => {
    const plan = buildAdPlacementPlan({
      userTier: 'free',
      configuredProviders: ['adsense', 'admob']
    });

    assert.deepEqual(plan.slots.map((slot) => `${slot.surface}:${slot.provider}:${slot.label}`), [
      'web_market_sidebar:adsense:Sponsored',
      'mobile_deals_feed:admob:Sponsored'
    ]);
    assert.equal(plan.excludedSurfaces.includes('deal_score'), true);
    assert.equal(plan.excludedSurfaces.includes('checkout_decision'), true);
    assert.equal(plan.affectsDealScore, false);
  });

  it('removes ads for premium users', () => {
    const plan = buildAdPlacementPlan({ userTier: 'premium', configuredProviders: ['adsense', 'admob'] });

    assert.deepEqual(plan.slots, []);
    assert.equal(plan.reason, 'Premium subscription removes ads.');
  });

  it('fails closed when checkout provider or price id is missing', () => {
    const plan = buildSubscriptionCheckoutPlan({
      userId: 'user-1',
      plan: 'premium_monthly',
      billingProviderConfigured: false
    });

    assert.deepEqual(plan, {
      status: 'blocked_missing_provider',
      reason: 'Subscription checkout requires configured billing provider and price id.'
    });
  });

  it('builds a billing-provider checkout request when configured', () => {
    const plan = buildSubscriptionCheckoutPlan({
      userId: 'user-1',
      plan: 'premium_yearly',
      billingProviderConfigured: true,
      providerPriceId: 'price_yearly_123',
      successUrl: 'https://groceryview.example/account?checkout=success',
      cancelUrl: 'https://groceryview.example/account?checkout=cancel'
    });

    assert.deepEqual(plan, {
      status: 'ready',
      provider: 'stripe_compatible',
      checkoutRequest: {
        customerReference: 'user-1',
        priceId: 'price_yearly_123',
        successUrl: 'https://groceryview.example/account?checkout=success',
        cancelUrl: 'https://groceryview.example/account?checkout=cancel',
        metadata: { plan: 'premium_yearly' }
      }
    });
  });

  it('enforces premium access only for active unexpired subscription entitlements', () => {
    const policy = buildSubscriptionAccessPolicy({
      now: '2026-05-20T00:00:00.000Z',
      entitlement: {
        tier: 'premium',
        plan: 'premium_yearly',
        status: 'active',
        currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
        provider: 'stripe_compatible',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });

    assert.deepEqual(policy, {
      userTier: 'premium',
      premiumFeaturesEnabled: true,
      adsRemoved: true,
      checkoutRequired: false,
      enforcementReasons: ['active_subscription_entitlement:premium_yearly'],
      accountActions: ['show_manage_subscription'],
      summary: 'Premium access is active.'
    });
  });

  it('fails closed to the free tier when entitlement data is missing, expired, or past due', () => {
    const missing = buildSubscriptionAccessPolicy({
      now: '2026-05-20T00:00:00.000Z',
      entitlement: null
    });
    const expired = buildSubscriptionAccessPolicy({
      now: '2026-05-20T00:00:00.000Z',
      entitlement: {
        tier: 'premium',
        plan: 'premium_monthly',
        status: 'active',
        currentPeriodEndsAt: '2026-05-19T23:59:59.000Z',
        updatedAt: '2026-05-19T00:00:00.000Z'
      }
    });
    const pastDue = buildSubscriptionAccessPolicy({
      now: '2026-05-20T00:00:00.000Z',
      entitlement: {
        tier: 'premium',
        plan: 'premium_monthly',
        status: 'past_due',
        currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
        provider: 'stripe_compatible',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });

    assert.deepEqual(
      [missing, expired, pastDue].map((policy) => ({
        userTier: policy.userTier,
        premiumFeaturesEnabled: policy.premiumFeaturesEnabled,
        adsRemoved: policy.adsRemoved,
        checkoutRequired: policy.checkoutRequired,
        enforcementReasons: policy.enforcementReasons,
        accountActions: policy.accountActions
      })),
      [
        {
          userTier: 'free',
          premiumFeaturesEnabled: false,
          adsRemoved: false,
          checkoutRequired: true,
          enforcementReasons: ['missing_subscription_entitlement'],
          accountActions: ['show_upgrade']
        },
        {
          userTier: 'free',
          premiumFeaturesEnabled: false,
          adsRemoved: false,
          checkoutRequired: true,
          enforcementReasons: ['subscription_period_expired:premium_monthly'],
          accountActions: ['show_renew']
        },
        {
          userTier: 'free',
          premiumFeaturesEnabled: false,
          adsRemoved: false,
          checkoutRequired: true,
          enforcementReasons: ['subscription_status_not_active:past_due'],
          accountActions: ['show_billing_issue']
        }
      ]
    );
  });
});
