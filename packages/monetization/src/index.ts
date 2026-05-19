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
