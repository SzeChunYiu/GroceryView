import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdPlacementPlan, buildSubscriptionCheckoutPlan } from '../index.js';

describe('monetization foundation', () => {
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
