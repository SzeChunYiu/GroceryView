import type { WatchlistAlert } from '@groceryview/core';
import type { TransactionalEmailClient, TransactionalEmailMessage } from '../lib/email.js';

export type RestockWatchlistAlert = Omit<WatchlistAlert, 'trigger' | 'type'> & {
  type: 'restock';
  trigger: {
    metric: 'availability';
    value: boolean | 'available' | 'in_stock' | 'restocked';
    storeName?: string;
    threshold?: never;
  };
};

export type EmailNotifiableWatchlistAlert = WatchlistAlert | RestockWatchlistAlert;

export type TriggeredPriceAlertEmailNotification = {
  recipientEmail: string;
  alert: EmailNotifiableWatchlistAlert;
  itemUrl?: string;
};

export type NotifyTriggeredPriceAlertsInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  notifications: TriggeredPriceAlertEmailNotification[];
  now: string;
};

export type TriggeredPriceAlertEmailSent = {
  recipientEmail: string;
  productId: string;
  messageId: string;
};

export type TriggeredPriceAlertEmailSkipped = {
  recipientEmail: string;
  productId: string;
  reason: 'not_price_threshold_alert' | 'not_restock_alert';
};

export type NotifyTriggeredPriceAlertsResult = {
  sent: TriggeredPriceAlertEmailSent[];
  skipped: TriggeredPriceAlertEmailSkipped[];
};

export async function notifyTriggeredPriceAlerts(
  input: NotifyTriggeredPriceAlertsInput
): Promise<NotifyTriggeredPriceAlertsResult> {
  const sent: TriggeredPriceAlertEmailSent[] = [];
  const skipped: TriggeredPriceAlertEmailSkipped[] = [];

  for (const notification of input.notifications) {
    if (!isEmailNotifiablePriceAlert(notification.alert)) {
      skipped.push({
        recipientEmail: notification.recipientEmail,
        productId: notification.alert.productId,
        reason: 'not_price_threshold_alert'
      });
      continue;
    }

    const message = buildTriggeredPriceAlertEmail(notification, input.baseUrl, input.now);
    const messageId = await input.emailClient.send(message);
    sent.push({
      recipientEmail: notification.recipientEmail,
      productId: notification.alert.productId,
      messageId
    });
  }

  return { sent, skipped };
}

export async function notifyTriggeredRestockAlerts(
  input: NotifyTriggeredPriceAlertsInput
): Promise<NotifyTriggeredPriceAlertsResult> {
  const sent: TriggeredPriceAlertEmailSent[] = [];
  const skipped: TriggeredPriceAlertEmailSkipped[] = [];

  for (const notification of input.notifications) {
    if (!isEmailNotifiableRestockAlert(notification.alert)) {
      skipped.push({
        recipientEmail: notification.recipientEmail,
        productId: notification.alert.productId,
        reason: 'not_restock_alert'
      });
      continue;
    }

    const message = buildTriggeredRestockAlertEmail(notification, input.baseUrl, input.now);
    const messageId = await input.emailClient.send(message);
    sent.push({
      recipientEmail: notification.recipientEmail,
      productId: notification.alert.productId,
      messageId
    });
  }

  return { sent, skipped };
}

export function isEmailNotifiablePriceAlert(alert: EmailNotifiableWatchlistAlert): boolean {
  return (
    alert.type === 'target_price' &&
    alert.trigger.metric === 'price' &&
    typeof alert.trigger.value === 'number' &&
    typeof alert.trigger.threshold === 'number'
  );
}

export function isEmailNotifiableRestockAlert(alert: EmailNotifiableWatchlistAlert): alert is RestockWatchlistAlert {
  return (
    alert.type === 'restock' &&
    alert.trigger.metric === 'availability' &&
    (alert.trigger.value === true ||
      alert.trigger.value === 'available' ||
      alert.trigger.value === 'in_stock' ||
      alert.trigger.value === 'restocked')
  );
}

export function buildTriggeredPriceAlertEmail(
  notification: TriggeredPriceAlertEmailNotification,
  baseUrl: string,
  now: string
): TransactionalEmailMessage {
  const { alert } = notification;
  const itemUrl = notification.itemUrl ?? buildProductUrl(baseUrl, alert.productId);
  const storeSuffix = alert.trigger.storeName ? ` at ${alert.trigger.storeName}` : '';
  const threshold = typeof alert.trigger.threshold === 'number' ? alert.trigger.threshold : undefined;

  const lines = [
    alert.message,
    '',
    `Current price: ${formatPriceValue(alert.trigger.value)}${storeSuffix}`,
    threshold === undefined ? undefined : `Alert threshold: ${formatSek(threshold)}`,
    `Open item: ${itemUrl}`,
    '',
    `Sent at: ${now}`
  ].filter((line): line is string => typeof line === 'string');

  return {
    to: notification.recipientEmail,
    subject: `${alert.productName} price drop alert`,
    text: lines.join('\n'),
    metadata: {
      type: alert.type,
      productId: alert.productId,
      sendAt: now
    }
  };
}

export function buildTriggeredRestockAlertEmail(
  notification: TriggeredPriceAlertEmailNotification,
  baseUrl: string,
  now: string
): TransactionalEmailMessage {
  const { alert } = notification;
  const itemUrl = notification.itemUrl ?? buildProductUrl(baseUrl, alert.productId);
  const storeSuffix = alert.trigger.storeName ? ` at ${alert.trigger.storeName}` : '';

  const lines = [
    alert.message,
    '',
    `${alert.productName} is available again${storeSuffix}.`,
    `Open item: ${itemUrl}`,
    '',
    `Sent at: ${now}`
  ];

  return {
    to: notification.recipientEmail,
    subject: `${alert.productName} is back in stock`,
    text: lines.join('\n'),
    metadata: {
      type: alert.type,
      productId: alert.productId,
      sendAt: now
    }
  };
}

function buildProductUrl(baseUrl: string, productId: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/product/${encodeURIComponent(productId)}`;
}

function formatSek(value: number): string {
  return `${value.toFixed(2)} SEK`;
}

function formatPriceValue(value: number | string | boolean): string {
  return typeof value === 'number' ? formatSek(value) : String(value);
}
