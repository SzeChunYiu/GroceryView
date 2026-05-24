import type { QueryExecutor } from '../database/postgres-query-executor.service.js';

export const stripeWebhookRoutes = {
  controllerPath: 'stripe/webhook',
  events: ['checkout.session.completed', 'customer.subscription.deleted'],
  planField: 'users.plan',
  premiumPlan: 'premium',
  freePlan: 'free'
} as const;

type StripeCheckoutSessionCompleted = {
  type: 'checkout.session.completed';
  data: {
    object: {
      client_reference_id?: string | null;
      customer?: string | null;
      customer_email?: string | null;
      metadata?: { userId?: string | null } | null;
      subscription?: string | null;
    };
  };
};

type StripeSubscriptionDeleted = {
  type: 'customer.subscription.deleted';
  data: {
    object: {
      customer?: string | null;
      metadata?: { userId?: string | null } | null;
    };
  };
};

export type StripePremiumWebhookEvent = StripeCheckoutSessionCompleted | StripeSubscriptionDeleted;

export type StripePlanUpdate = {
  plan: typeof stripeWebhookRoutes.premiumPlan | typeof stripeWebhookRoutes.freePlan;
  userId: string | null;
  stripeCustomerId: string | null;
  customerEmail: string | null;
  stripeSubscriptionId: string | null;
};

export function mapStripeWebhookToPlanUpdate(event: StripePremiumWebhookEvent): StripePlanUpdate {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    return {
      plan: stripeWebhookRoutes.premiumPlan,
      userId: session.metadata?.userId ?? session.client_reference_id ?? null,
      stripeCustomerId: session.customer ?? null,
      customerEmail: session.customer_email ?? null,
      stripeSubscriptionId: session.subscription ?? null
    };
  }

  const subscription = event.data.object;

  return {
    plan: stripeWebhookRoutes.freePlan,
    userId: subscription.metadata?.userId ?? null,
    stripeCustomerId: subscription.customer ?? null,
    customerEmail: null,
    stripeSubscriptionId: null
  };
}

export async function updateUserPlanFromStripeWebhook(executor: QueryExecutor, event: StripePremiumWebhookEvent) {
  const update = mapStripeWebhookToPlanUpdate(event);

  if (!update.userId && !update.stripeCustomerId && !update.customerEmail) {
    return { updated: false, reason: 'stripe_webhook_missing_user_reference', update };
  }

  const rows = await executor.query<{ id: string; plan: string }>(
    `update users
      set plan = $1,
          stripe_customer_id = coalesce(stripe_customer_id, $2),
          stripe_subscription_id = coalesce($3, stripe_subscription_id),
          updated_at = now()
      where ($4::text is not null and id = $4)
         or ($2::text is not null and stripe_customer_id = $2)
         or ($5::text is not null and email = $5)
      returning id, plan`,
    [update.plan, update.stripeCustomerId, update.stripeSubscriptionId, update.userId, update.customerEmail]
  );

  return {
    updated: rows.length > 0,
    reason: rows.length > 0 ? 'stripe_webhook_plan_updated' : 'stripe_webhook_user_not_found',
    update,
    users: rows
  };
}
