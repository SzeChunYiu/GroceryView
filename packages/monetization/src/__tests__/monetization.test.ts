import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdDeliveryComplianceReport,
  buildAdPlacementPlan,
  buildMobilePremiumEntitlementPlan,
  buildMonetizationProviderReadinessReport,
  buildSubscriptionAccessPolicy,
  buildSubscriptionCheckoutPlan,
  parseStripeCompatibleSubscriptionEvent,
  processBillingSubscriptionEvent
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

  it('blocks ad delivery candidates that violate trust policy', () => {
    const report = buildAdDeliveryComplianceReport([
      {
        surface: 'web_market_sidebar',
        provider: 'adsense',
        userTier: 'free',
        label: 'Sponsored',
        organicRankingSeparated: true,
        affectsDealScore: false
      },
      {
        surface: 'deal_score',
        provider: 'adsense',
        userTier: 'free',
        label: 'Sponsored',
        organicRankingSeparated: true,
        affectsDealScore: true
      },
      {
        surface: 'mobile_deals_feed',
        provider: 'admob',
        userTier: 'premium',
        organicRankingSeparated: false,
        affectsDealScore: false
      }
    ]);

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.allowed.map((candidate) => candidate.surface), ['web_market_sidebar']);
    assert.deepEqual(report.blocked.map((entry) => entry.reasons), [
      ['ad_surface_blocked:deal_score', 'deal_score_must_not_be_affected'],
      ['premium_users_must_not_receive_ads', 'sponsored_label_required', 'organic_ranking_separation_required']
    ]);
  });

  it('marks labeled non-critical free-tier ad delivery candidates compliant', () => {
    const report = buildAdDeliveryComplianceReport([
      {
        surface: 'mobile_deals_feed',
        provider: 'admob',
        userTier: 'free',
        label: 'Sponsored',
        organicRankingSeparated: true,
        affectsDealScore: false
      }
    ]);

    assert.equal(report.status, 'compliant');
    assert.deepEqual(report.blocked, []);
    assert.equal(report.summary, 'Ad delivery candidates comply with GroceryView trust policy.');
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

  it('normalizes active billing subscription events into entitlement mutations', () => {
    const entitlement = processBillingSubscriptionEvent({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_active_1',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_yearly',
      currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      occurredAt: '2026-05-20T00:00:00.000Z'
    });

    assert.deepEqual(entitlement, {
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_yearly',
      status: 'active',
      currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });
  });

  it('normalizes Stripe-compatible active subscription webhooks into billing events', () => {
    const event = parseStripeCompatibleSubscriptionEvent({
      receivedAt: '2026-05-20T12:00:00.000Z',
      priceIdPlanMap: { price_yearly_123: 'premium_yearly' },
      payload: {
        id: 'evt_123',
        type: 'customer.subscription.updated',
        created: 1779278400,
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: 1810771200,
            metadata: { userId: 'user-1' },
            items: { data: [{ price: { id: 'price_yearly_123' } }] }
          }
        }
      }
    });

    assert.deepEqual(event, {
      provider: 'stripe_compatible',
      providerEventId: 'evt_123',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_yearly',
      currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      occurredAt: '2026-05-20T12:00:00.000Z'
    });
    assert.deepEqual(processBillingSubscriptionEvent(event!), {
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_yearly',
      status: 'active',
      currentPeriodEndsAt: '2027-05-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      updatedAt: '2026-05-20T12:00:00.000Z'
    });
  });

  it('normalizes Stripe-compatible past-due and canceled webhooks fail-closed', () => {
    const pastDue = parseStripeCompatibleSubscriptionEvent({
      receivedAt: '2026-05-20T12:00:00.000Z',
      payload: {
        id: 'evt_past_due',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            status: 'past_due',
            current_period_end: 1779364800,
            metadata: { userId: 'user-1', plan: 'premium_monthly' }
          }
        }
      }
    });
    const canceled = parseStripeCompatibleSubscriptionEvent({
      receivedAt: '2026-05-20T12:00:00.000Z',
      payload: {
        id: 'evt_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
            metadata: { userId: 'user-1' }
          }
        }
      }
    });

    assert.equal(pastDue?.type, 'subscription.past_due');
    assert.equal(pastDue?.plan, 'premium_monthly');
    assert.equal(canceled?.type, 'subscription.canceled');
    assert.equal(canceled?.plan, undefined);
    assert.deepEqual(buildSubscriptionAccessPolicy({
      now: '2026-05-20T12:00:00.000Z',
      entitlement: processBillingSubscriptionEvent(pastDue!)
    }).accountActions, ['show_billing_issue']);
    assert.deepEqual(buildSubscriptionAccessPolicy({
      now: '2026-05-20T12:00:00.000Z',
      entitlement: processBillingSubscriptionEvent(canceled!)
    }).accountActions, ['show_renew']);
  });

  it('ignores unsupported Stripe-compatible webhook types and rejects missing user mapping', () => {
    assert.equal(parseStripeCompatibleSubscriptionEvent({
      receivedAt: '2026-05-20T12:00:00.000Z',
      payload: { id: 'evt_invoice', type: 'invoice.paid', data: { object: {} } }
    }), null);

    assert.throws(
      () =>
        parseStripeCompatibleSubscriptionEvent({
          receivedAt: '2026-05-20T12:00:00.000Z',
          payload: {
            id: 'evt_missing_user',
            type: 'customer.subscription.updated',
            data: { object: { status: 'active', metadata: { plan: 'premium_monthly' } } }
          }
        }),
      /metadata.userId is required/
    );
  });

  it('normalizes past-due and canceled billing subscription events into fail-closed entitlements', () => {
    const pastDue = processBillingSubscriptionEvent({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_past_due_1',
      type: 'subscription.past_due',
      userId: 'user-1',
      plan: 'premium_monthly',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      occurredAt: '2026-05-21T00:00:00.000Z'
    });
    const canceled = processBillingSubscriptionEvent({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_canceled_1',
      type: 'subscription.canceled',
      userId: 'user-1',
      plan: 'premium_monthly',
      providerSubscriptionId: 'sub_123',
      occurredAt: '2026-05-22T00:00:00.000Z'
    });

    assert.deepEqual(pastDue, {
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'past_due',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      updatedAt: '2026-05-21T00:00:00.000Z'
    });
    assert.deepEqual(canceled, {
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'canceled',
      provider: 'stripe_compatible',
      providerSubscriptionId: 'sub_123',
      updatedAt: '2026-05-22T00:00:00.000Z'
    });
    assert.deepEqual(buildSubscriptionAccessPolicy({
      now: '2026-05-22T00:00:00.000Z',
      entitlement: canceled
    }).accountActions, ['show_renew']);
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

  it('hides mobile ads for active premium entitlements and schedules status refresh', () => {
    const plan = buildMobilePremiumEntitlementPlan({
      userId: 'user-1',
      userTier: 'premium',
      platform: 'ios',
      billingProviderConfigured: true,
      activeSubscriptionPlan: 'premium_monthly',
      expiresAt: '2026-06-20T00:00:00.000Z',
      now: '2026-05-20T00:00:00.000Z'
    });

    assert.equal(plan.premiumActive, true);
    assert.deepEqual(plan.adPlan.slots, []);
    assert.deepEqual(plan.blockers, []);
    assert.deepEqual(plan.actions, ['hide_mobile_ads', 'refresh_subscription_status']);
  });

  it('keeps labeled mobile ads and checkout actions for free users', () => {
    const plan = buildMobilePremiumEntitlementPlan({
      userId: 'user-2',
      userTier: 'free',
      platform: 'android',
      billingProviderConfigured: true,
      now: '2026-05-20T00:00:00.000Z'
    });

    assert.equal(plan.premiumActive, false);
    assert.deepEqual(plan.adPlan.slots.map((slot) => `${slot.surface}:${slot.provider}:${slot.label}`), ['mobile_deals_feed:admob:Sponsored']);
    assert.equal(plan.adPlan.affectsDealScore, false);
    assert.deepEqual(plan.blockers, []);
    assert.deepEqual(plan.actions, ['show_mobile_deals_ads', 'start_premium_checkout', 'restore_purchase']);
  });

  it('blocks expired mobile premium recovery when billing is not configured', () => {
    const plan = buildMobilePremiumEntitlementPlan({
      userId: 'user-3',
      userTier: 'premium',
      platform: 'ios',
      billingProviderConfigured: false,
      activeSubscriptionPlan: 'premium_yearly',
      expiresAt: '2026-05-19T00:00:00.000Z',
      now: '2026-05-20T00:00:00.000Z'
    });

    assert.equal(plan.premiumActive, false);
    assert.deepEqual(plan.blockers, ['mobile_billing_provider_not_configured']);
    assert.deepEqual(plan.actions, ['show_mobile_deals_ads']);
  });
});
