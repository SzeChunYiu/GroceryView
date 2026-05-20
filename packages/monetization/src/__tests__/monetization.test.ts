import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdPlacementPlan,
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
