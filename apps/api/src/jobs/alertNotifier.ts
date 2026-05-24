import type { WatchlistAlert } from '@groceryview/core';
import type { TransactionalEmailClient, TransactionalEmailMessage } from '../lib/email.js';

export type TriggeredPriceAlertEmailNotification = {
  recipientEmail: string;
  alert: WatchlistAlert;
  itemUrl?: string;
};

export type TriggeredRestockAlertEmailNotification = TriggeredPriceAlertEmailNotification;

export type NotifyTriggeredPriceAlertsInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  notifications: TriggeredPriceAlertEmailNotification[];
  now: string;
};

export type NotifyTriggeredRestockAlertsInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  notifications: TriggeredRestockAlertEmailNotification[];
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

export type NotifyTriggeredRestockAlertsResult = NotifyTriggeredPriceAlertsResult;

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
  input: NotifyTriggeredRestockAlertsInput
): Promise<NotifyTriggeredRestockAlertsResult> {
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

export function isEmailNotifiablePriceAlert(alert: WatchlistAlert): boolean {
  return (
    alert.type === 'target_price' &&
    alert.trigger.metric === 'price' &&
    typeof alert.trigger.value === 'number' &&
    typeof alert.trigger.threshold === 'number'
  );
}

export function isEmailNotifiableRestockAlert(alert: WatchlistAlert): boolean {
  const trigger = alert.trigger as { metric?: string; value?: unknown };
  return (
    ['restock', 'back_in_stock', 'availability'].includes(String(alert.type)) &&
    trigger.metric === 'availability' &&
    (trigger.value === true || trigger.value === 'available' || trigger.value === 'in_stock')
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
  notification: TriggeredRestockAlertEmailNotification,
  baseUrl: string,
  now: string
): TransactionalEmailMessage {
  const { alert } = notification;
  const itemUrl = notification.itemUrl ?? buildProductUrl(baseUrl, alert.productId);
  const trigger = alert.trigger as { storeName?: string };
  const storeSuffix = trigger.storeName ? ` at ${trigger.storeName}` : ' at a watched store';
  const lines = [
    alert.message,
    '',
    `${alert.productName} is back in stock${storeSuffix}.`,
    `Open item: ${itemUrl}`,
    '',
    `Sent at: ${now}`
  ];

  return {
    to: notification.recipientEmail,
    subject: `${alert.productName} is back in stock`,
    text: lines.join('\n'),
    metadata: {
      type: String(alert.type),
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

function formatPriceValue(value: number | string): string {
  return typeof value === 'number' ? formatSek(value) : value;
}
