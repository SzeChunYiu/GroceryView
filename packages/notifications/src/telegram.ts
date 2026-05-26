import type { DeliveryNotification, NotificationProvider, NotificationProviderFetch } from './index.js';

export type TelegramBotProviderOptions = {
  botToken: string;
  fetch?: NotificationProviderFetch;
};

export type TelegramPriceAlert = {
  productId: string;
  productName: string;
  type: string;
  trigger: {
    metric: string;
    value: number | string;
    threshold?: number;
    storeName?: string;
  };
  message: string;
};

export type TelegramNotificationSubscription = {
  userId: string;
  productId?: string;
  chatId: string;
  active: boolean;
};

export type PlanTelegramPriceAlertNotificationsInput = {
  now: string;
  alerts: TelegramPriceAlert[];
  subscriptions: TelegramNotificationSubscription[];
};

export type PlannedTelegramPriceAlertNotification = {
  alert: TelegramPriceAlert;
  subscription: TelegramNotificationSubscription;
  notification: DeliveryNotification;
};

function requireSecret(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required.`);
  return value.trim();
}

function defaultFetch(): NotificationProviderFetch {
  if (typeof fetch !== 'function') throw new Error('fetch is not available for Telegram delivery.');
  return (url, init) => fetch(url, init);
}

function readTelegramError(payload: unknown, fallback: string): string {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return fallback;
  const record = payload as Record<string, unknown>;
  const description = record.description;
  return typeof description === 'string' && description.trim() ? description : fallback;
}

export function createTelegramBotProvider(options: TelegramBotProviderOptions): NotificationProvider {
  const botToken = requireSecret(options.botToken, 'Telegram bot token');
  const fetcher = options.fetch ?? defaultFetch();

  return {
    async send(message) {
      const response = await fetcher(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.recipient,
          text: `${message.title}\n\n${message.body}`,
          disable_web_page_preview: true
        })
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // Telegram normally returns JSON; retain HTTP fallback for non-JSON failures.
      }

      if (!response.ok) {
        throw new Error(`Telegram delivery failed: ${readTelegramError(payload, `${response.status} ${response.statusText}`.trim())}`);
      }

      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        return `telegram:${message.recipient}:${message.metadata.sendAt}`;
      }

      const record = payload as Record<string, unknown>;
      if (record.ok === false) {
        throw new Error(`Telegram delivery failed: ${readTelegramError(payload, 'request rejected')}`);
      }

      const result = record.result;
      if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
        const messageId = (result as Record<string, unknown>).message_id;
        if (typeof messageId === 'number' || typeof messageId === 'string') return `telegram:${messageId}`;
      }

      return `telegram:${message.recipient}:${message.metadata.sendAt}`;
    }
  };
}

export function planTelegramPriceAlertNotificationDeliveries(
  input: PlanTelegramPriceAlertNotificationsInput
): PlannedTelegramPriceAlertNotification[] {
  if (Number.isNaN(Date.parse(input.now))) throw new Error('now must be an ISO date.');

  const activeSubscriptions = input.subscriptions.filter((subscription) => subscription.active && subscription.chatId.trim());
  const notifications: PlannedTelegramPriceAlertNotification[] = [];

  for (const alert of input.alerts) {
    if (alert.type !== 'target_price' || alert.trigger.metric !== 'price') continue;
    if (typeof alert.trigger.value !== 'number' || alert.trigger.threshold === undefined) continue;
    if (alert.trigger.value > alert.trigger.threshold) continue;

    for (const subscription of activeSubscriptions) {
      if (subscription.productId !== undefined && subscription.productId !== alert.productId) continue;
      notifications.push({
        alert,
        subscription,
        notification: {
          channel: 'telegram',
          type: 'target_price',
          title: `${alert.productName} price alert`,
          body: alert.message,
          priority: 'high',
          sendAt: input.now,
          recipient: subscription.chatId.trim()
        }
      });
    }
  }

  return notifications;
}

export function planTelegramPriceAlertNotifications(input: PlanTelegramPriceAlertNotificationsInput): DeliveryNotification[] {
  return planTelegramPriceAlertNotificationDeliveries(input).map((planned) => planned.notification);
}
