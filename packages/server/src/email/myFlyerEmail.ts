import type { QueryExecutor } from '@groceryview/db';
import type { TransactionalEmailClient, TransactionalEmailMessage } from '@groceryview/notifications';

export type MyFlyerCountry = 'SE' | 'NO' | 'IS' | string;

export type MyFlyerOffer = {
  productId: string;
  productName: string;
  chainName: string;
  storeName?: string;
  currentPrice: number;
  regularPrice?: number;
  currency: string;
  promotionText?: string;
  validUntil?: string;
  sourceUrl?: string;
  flyerUrl?: string;
};

export type MyFlyerEmailInput = {
  baseUrl: string;
  country: MyFlyerCountry;
  generatedAt: string;
  offers: MyFlyerOffer[];
  recipientEmail: string;
  unsubscribeUrl: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
};

export type MyFlyerEmailSubscription = {
  userId: string;
  recipientEmail: string;
  country: MyFlyerCountry;
  timezone?: string;
};

export type MyFlyerEmailRepository = {
  listActiveMyFlyerEmailSubscriptions(country: MyFlyerCountry): Promise<MyFlyerEmailSubscription[]>;
  listMyFlyerOffers(input: {
    country: MyFlyerCountry;
    limit: number;
    userId: string;
    weekStart: string;
    weekEnd: string;
  }): Promise<MyFlyerOffer[]>;
  recordMyFlyerEmailSend?(send: {
    country: MyFlyerCountry;
    itemCount: number;
    messageId: string;
    recipientEmail: string;
    sentAt: string;
    userId: string;
  }): Promise<void>;
};

type MyFlyerSubscriptionRow = {
  user_id: string;
  recipient_email: string;
};

type MyFlyerOfferRow = {
  product_id: string;
  product_name: string;
  chain_name: string;
  store_name: string | null;
  current_price: string | number;
  regular_price: string | number | null;
  currency: string;
  promotion_text: string | null;
  valid_until: string | Date | null;
  source_url: string | null;
  flyer_url: string | null;
};

export type MyFlyerEmailCronInput = {
  baseUrl: string;
  country: MyFlyerCountry;
  emailClient: TransactionalEmailClient;
  maxOffersPerUser?: number;
  now?: string;
  repository: MyFlyerEmailRepository;
};

export type MyFlyerEmailCronResult = {
  country: MyFlyerCountry;
  cronExpression: typeof myFlyerWeeklyEmailCronExpression;
  sendAt: string;
  status: 'sent' | 'skipped_not_scheduled' | 'no_subscribers' | 'no_offers';
  subscriptionCount: number;
  sent: Array<{ userId: string; recipientEmail: string; messageId: string; itemCount: number }>;
  skipped: Array<{ userId: string; recipientEmail: string; reason: 'no_flyer_offers' | 'missing_recipient_email' }>;
  timezone: string;
  weekStart: string;
  weekEnd: string;
};

export const myFlyerWeeklyEmailCronExpression = '0 6 * * 1' as const;

const defaultMaxOffersPerUser = 12;
const htmlEscapePattern = /[&<>"']/g;
const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function myFlyerTimezoneForCountry(country: MyFlyerCountry): string {
  const normalized = country.toUpperCase();
  if (normalized === 'SE') return 'Europe/Stockholm';
  if (normalized === 'NO') return 'Europe/Oslo';
  if (normalized === 'IS') return 'Atlantic/Reykjavik';
  return 'UTC';
}

export function myFlyerSubscriptionProductId(country: MyFlyerCountry): string {
  return `my-flyer-weekly:${country.toUpperCase()}`;
}

export function createPostgresMyFlyerEmailRepository(executor: QueryExecutor): MyFlyerEmailRepository {
  return {
    async listActiveMyFlyerEmailSubscriptions(country) {
      const rows = await executor.query<MyFlyerSubscriptionRow>(
        `/* my_flyer_email_subscriptions */
         select distinct on (notification_subscriptions.user_id)
                notification_subscriptions.user_id,
                notification_subscriptions.recipient as recipient_email
           from notification_subscriptions
          where notification_subscriptions.active = true
            and notification_subscriptions.channel = 'email'
            and notification_subscriptions.product_id in ($1, 'my-flyer-weekly')
            and nullif(btrim(notification_subscriptions.recipient), '') is not null
          order by notification_subscriptions.user_id,
                   notification_subscriptions.updated_at desc,
                   notification_subscriptions.id`,
        [myFlyerSubscriptionProductId(country)]
      );
      return rows.map((row) => ({
        userId: row.user_id,
        recipientEmail: row.recipient_email.trim(),
        country,
        timezone: myFlyerTimezoneForCountry(country)
      }));
    },

    async listMyFlyerOffers(input) {
      const rows = await executor.query<MyFlyerOfferRow>(
        `/* my_flyer_weekly_offers */
         select products.id::text as product_id,
                products.canonical_name as product_name,
                chains.name as chain_name,
                stores.name as store_name,
                observations.price as current_price,
                observations.regular_price,
                observations.currency,
                observations.promotion_text,
                observations.valid_until,
                source_runs.source_url,
                observations.provenance->>'flyerUrl' as flyer_url
           from observations
           join products on products.id = observations.product_id
           join chains on chains.id = observations.chain_id
           left join stores on stores.id = observations.store_id
           left join source_runs on source_runs.id = observations.source_run_id
          where observations.price_type in ('promotion', 'member')
            and observations.regular_price is not null
            and observations.price < observations.regular_price
            and chains.country_code = upper($1)::char(2)
            and observations.observed_at >= $2::timestamptz
            and observations.observed_at < $3::timestamptz
          order by (observations.regular_price - observations.price) desc,
                   observations.observed_at desc,
                   products.canonical_name
          limit $4`,
        [input.country, input.weekStart, input.weekEnd, input.limit]
      );
      return rows.map(mapMyFlyerOfferRow);
    },

    async recordMyFlyerEmailSend(send) {
      await executor.query(
        `insert into notification_tasks(id, channel, type, title, body, priority, send_at, recipient, attempt_count, max_attempts, status)
         values ($1, 'email', 'my_flyer_weekly_email', $2, $3, 'normal', $4::timestamptz, $5, 1, 3, 'delivered')
         on conflict (id) do update
           set status = excluded.status,
               updated_at = now()`,
        [
          `my-flyer-email:${send.country}:${send.userId}:${send.sentAt}`,
          `MyFlyer weekly email sent to ${send.userId}`,
          `messageId=${send.messageId}; itemCount=${send.itemCount}`,
          send.sentAt,
          send.recipientEmail
        ]
      );
    }
  };
}

export function isMyFlyerWeeklyEmailCronDue(input: { country: MyFlyerCountry; now: string }): boolean {
  const timezone = myFlyerTimezoneForCountry(input.country);
  const date = new Date(input.now);
  if (Number.isNaN(date.getTime())) throw new Error('now must be an ISO date.');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  return weekday === 'Mon' && hour === '06' && minute === '00';
}

export function myFlyerWeekWindow(now: string): { weekStart: string; weekEnd: string } {
  const end = new Date(now);
  if (Number.isNaN(end.getTime())) throw new Error('now must be an ISO date.');
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString()
  };
}

export function buildMyFlyerEmail(input: MyFlyerEmailInput): TransactionalEmailMessage {
  const offerLines = input.offers.map((offer, index) => {
    const savings = offer.regularPrice && offer.regularPrice > offer.currentPrice
      ? `, save ${formatMoney(offer.regularPrice - offer.currentPrice, offer.currency)}`
      : '';
    const location = [offer.chainName, offer.storeName].filter(Boolean).join(' · ');
    const validity = offer.validUntil ? ` · valid until ${formatDate(offer.validUntil)}` : '';
    return `${index + 1}. ${offer.productName} — ${formatMoney(offer.currentPrice, offer.currency)}${savings}\n   ${location}${validity}${offer.promotionText ? ` · ${offer.promotionText}` : ''}`;
  });

  const text = [
    `Your GroceryView MyFlyer for ${input.country}`,
    `Window: ${formatDate(input.weekStart)} to ${formatDate(input.weekEnd)}`,
    '',
    ...offerLines,
    '',
    `Open GroceryView: ${input.baseUrl.replace(/\/+$/, '')}/deals`,
    `Manage email preferences: ${input.baseUrl.replace(/\/+$/, '')}/account/email-prefs`,
    `Unsubscribe: ${input.unsubscribeUrl}`,
    '',
    'Only verified flyer rows are included; missing chains or products are not estimated.'
  ].join('\n');

  return {
    to: input.recipientEmail,
    subject: `Your GroceryView MyFlyer for ${formatDate(input.weekEnd)}`,
    text,
    html: renderMyFlyerEmailHtml(input),
    metadata: {
      type: 'my_flyer_weekly_email',
      country: input.country,
      itemCount: String(input.offers.length),
      sendAt: input.generatedAt,
      userId: input.userId
    }
  };
}

export async function runMyFlyerWeeklyEmailCron(input: MyFlyerEmailCronInput): Promise<MyFlyerEmailCronResult> {
  const now = input.now ?? new Date().toISOString();
  const timezone = myFlyerTimezoneForCountry(input.country);
  const { weekStart, weekEnd } = myFlyerWeekWindow(now);
  const base: Omit<MyFlyerEmailCronResult, 'status' | 'subscriptionCount' | 'sent' | 'skipped'> = {
    country: input.country,
    cronExpression: myFlyerWeeklyEmailCronExpression,
    sendAt: now,
    timezone,
    weekStart,
    weekEnd
  };

  if (!isMyFlyerWeeklyEmailCronDue({ country: input.country, now })) {
    return { ...base, status: 'skipped_not_scheduled', subscriptionCount: 0, sent: [], skipped: [] };
  }

  const subscriptions = await input.repository.listActiveMyFlyerEmailSubscriptions(input.country);
  if (subscriptions.length === 0) {
    return { ...base, status: 'no_subscribers', subscriptionCount: 0, sent: [], skipped: [] };
  }

  const sent: MyFlyerEmailCronResult['sent'] = [];
  const skipped: MyFlyerEmailCronResult['skipped'] = [];
  const maxOffersPerUser = normalizeLimit(input.maxOffersPerUser ?? defaultMaxOffersPerUser);

  for (const subscription of subscriptions) {
    if (!subscription.recipientEmail.trim()) {
      skipped.push({ userId: subscription.userId, recipientEmail: subscription.recipientEmail, reason: 'missing_recipient_email' });
      continue;
    }

    const offers = await input.repository.listMyFlyerOffers({
      country: input.country,
      limit: maxOffersPerUser,
      userId: subscription.userId,
      weekStart,
      weekEnd
    });
    if (offers.length === 0) {
      skipped.push({ userId: subscription.userId, recipientEmail: subscription.recipientEmail, reason: 'no_flyer_offers' });
      continue;
    }

    const message = buildMyFlyerEmail({
      baseUrl: input.baseUrl,
      country: input.country,
      generatedAt: now,
      offers,
      recipientEmail: subscription.recipientEmail,
      unsubscribeUrl: buildUnsubscribeUrl(input.baseUrl, subscription.userId),
      userId: subscription.userId,
      weekStart,
      weekEnd
    });
    const messageId = await input.emailClient.send(message);
    await input.repository.recordMyFlyerEmailSend?.({
      country: input.country,
      itemCount: offers.length,
      messageId,
      recipientEmail: subscription.recipientEmail,
      sentAt: now,
      userId: subscription.userId
    });
    sent.push({ userId: subscription.userId, recipientEmail: subscription.recipientEmail, messageId, itemCount: offers.length });
  }

  return {
    ...base,
    status: sent.length > 0 ? 'sent' : 'no_offers',
    subscriptionCount: subscriptions.length,
    sent,
    skipped
  };
}

function renderMyFlyerEmailHtml(input: MyFlyerEmailInput): string {
  const rows = input.offers.map((offer) => {
    const savings = offer.regularPrice && offer.regularPrice > offer.currentPrice
      ? `<span style="color:#047857;font-weight:700">Save ${escapeHtml(formatMoney(offer.regularPrice - offer.currentPrice, offer.currency))}</span>`
      : '';
    const location = [offer.chainName, offer.storeName].filter(Boolean).join(' · ');
    const href = offer.flyerUrl ?? offer.sourceUrl ?? `${input.baseUrl.replace(/\/+$/, '')}/deals`;
    return `<li style="margin:0 0 16px"><a href="${escapeHtml(href)}" style="font-weight:700;color:#0f172a">${escapeHtml(offer.productName)}</a><br><span>${escapeHtml(formatMoney(offer.currentPrice, offer.currency))}</span>${savings ? ` · ${savings}` : ''}<br><span style="color:#475569">${escapeHtml(location || 'GroceryView')} ${offer.validUntil ? `· valid until ${escapeHtml(formatDate(offer.validUntil))}` : ''}</span>${offer.promotionText ? `<br><span>${escapeHtml(offer.promotionText)}</span>` : ''}</li>`;
  }).join('');

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5"><main style="max-width:640px;margin:auto"><h1>Your GroceryView MyFlyer</h1><p>Verified flyer offers for ${escapeHtml(input.country)} from ${escapeHtml(formatDate(input.weekStart))} to ${escapeHtml(formatDate(input.weekEnd))}.</p><ol>${rows}</ol><p><a href="${escapeHtml(input.baseUrl.replace(/\/+$/, ''))}/account/email-prefs">Manage email preferences</a> · <a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe</a></p><p style="color:#64748b;font-size:12px">Only verified flyer rows are included; GroceryView does not estimate missing products or chains.</p></main></body></html>`;
}

function normalizeLimit(value: number): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error('maxOffersPerUser must be a positive integer.');
  return Math.min(value, 50);
}

function buildUnsubscribeUrl(baseUrl: string, userId: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/account/email-prefs?userId=${encodeURIComponent(userId)}&unsubscribe=my-flyer`;
}

function mapMyFlyerOfferRow(row: MyFlyerOfferRow): MyFlyerOffer {
  return {
    productId: row.product_id,
    productName: row.product_name,
    chainName: row.chain_name,
    ...(row.store_name ? { storeName: row.store_name } : {}),
    currentPrice: numeric(row.current_price),
    ...(row.regular_price === null ? {} : { regularPrice: numeric(row.regular_price) }),
    currency: row.currency,
    ...(row.promotion_text ? { promotionText: row.promotion_text } : {}),
    ...(row.valid_until ? { validUntil: row.valid_until instanceof Date ? row.valid_until.toISOString() : row.valid_until } : {}),
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    ...(row.flyer_url ? { flyerUrl: row.flyer_url } : {})
  };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

function numeric(value: string | number): number {
  const result = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(result)) throw new Error(`Invalid MyFlyer numeric value: ${value}`);
  return result;
}

function escapeHtml(value: string): string {
  return value.replace(htmlEscapePattern, (char) => htmlEscapes[char] ?? char);
}
