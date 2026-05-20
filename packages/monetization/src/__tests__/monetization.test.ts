import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdPlacementPlan,
  buildMonetizationProviderReadinessReport,
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
});
