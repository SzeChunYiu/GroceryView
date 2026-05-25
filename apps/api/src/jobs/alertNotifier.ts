import type { WatchlistAlert } from '@groceryview/core';
import type { TransactionalEmailClient, TransactionalEmailMessage } from '../lib/email.js';

export type TriggeredPriceAlertEmailNotification = {
  recipientEmail: string;
  alert: WatchlistAlert;
  itemUrl?: string;
};

export type NotifyTriggeredPriceAlertsInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  notifications: TriggeredPriceAlertEmailNotification[];
  now: string;
};

export type RestockAlertEmailNotification = {
  recipientEmail: string;
  productId: string;
  productName: string;
  storeName: string;
  itemUrl?: string;
};

export type NotifyRestockAlertsInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  notifications: RestockAlertEmailNotification[];
  now: string;
};

export type WatchedRestockItem = {
  recipientEmail: string;
  productId: string;
  productName: string;
  wasOutOfStock: boolean;
  itemUrl?: string;
};

export type RestockAvailabilitySnapshot = {
  productId: string;
  storeName: string;
  isAvailable: boolean;
};

export type TriggeredPriceAlertEmailSent = {
  recipientEmail: string;
  productId: string;
  messageId: string;
};

export type TriggeredPriceAlertEmailSkipped = {
  recipientEmail: string;
  productId: string;
  reason: 'not_price_threshold_alert' | 'one_off_outlier';
};

export type NotifyTriggeredPriceAlertsResult = {
  sent: TriggeredPriceAlertEmailSent[];
  skipped: TriggeredPriceAlertEmailSkipped[];
};

export type RestockAlertEmailSent = {
  recipientEmail: string;
  productId: string;
  messageId: string;
};

export type NotifyRestockAlertsResult = {
  sent: RestockAlertEmailSent[];
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

    if (isOneOffOutlierAlert(notification.alert)) {
      skipped.push({
        recipientEmail: notification.recipientEmail,
        productId: notification.alert.productId,
        reason: 'one_off_outlier'
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

export async function notifyRestockAlerts(
  input: NotifyRestockAlertsInput
): Promise<NotifyRestockAlertsResult> {
  const sent: RestockAlertEmailSent[] = [];

  for (const notification of input.notifications) {
    const messageId = await input.emailClient.send(buildRestockAlertEmail(notification, input.baseUrl, input.now));
    sent.push({
      recipientEmail: notification.recipientEmail,
      productId: notification.productId,
      messageId
    });
  }

  return { sent };
}

export function restockNotificationsFromAvailabilityTransitions(input: {
  watchedItems: WatchedRestockItem[];
  availability: RestockAvailabilitySnapshot[];
}): RestockAlertEmailNotification[] {
  const availableByProduct = new Map<string, RestockAvailabilitySnapshot>();
  for (const row of input.availability) {
    if (row.isAvailable && !availableByProduct.has(row.productId)) {
      availableByProduct.set(row.productId, row);
    }
  }

  return input.watchedItems.flatMap((item) => {
    if (!item.wasOutOfStock) return [];
    const available = availableByProduct.get(item.productId);
    if (!available) return [];
    const notification: RestockAlertEmailNotification = {
      recipientEmail: item.recipientEmail,
      productId: item.productId,
      productName: item.productName,
      storeName: available.storeName
    };
    if (item.itemUrl) notification.itemUrl = item.itemUrl;
    return [notification];
  });
}

export function isEmailNotifiablePriceAlert(alert: WatchlistAlert): boolean {
  return (
    alert.type === 'target_price' &&
    alert.trigger.metric === 'price' &&
    typeof alert.trigger.value === 'number' &&
    typeof alert.trigger.threshold === 'number'
  );
}

export function isOneOffOutlierAlert(alert: WatchlistAlert): boolean {
  if (!isEmailNotifiablePriceAlert(alert)) {
    return false;
  }

  const trigger = alert.trigger as Record<string, unknown>;
  const outlierStreak = numericTriggerField(trigger, ['outlierStreak', 'consecutiveOutlierCount', 'outlierCount']) ?? 1;
  if (outlierStreak > 1) {
    return false;
  }

  if (trigger.isOutlier === true || trigger.outlier === true || trigger.outlierWarning === true) {
    return true;
  }

  if (typeof alert.trigger.value !== 'number') {
    return false;
  }

  const value = alert.trigger.value;
  const low = numericTriggerField(trigger, ['confidenceLow', 'lowerConfidenceBound', 'lowConfidence', 'bandLow']);
  const high = numericTriggerField(trigger, ['confidenceHigh', 'upperConfidenceBound', 'highConfidence', 'bandHigh']);

  if (low !== undefined && value < low) {
    return true;
  }

  if (high !== undefined && value > high) {
    return true;
  }

  const baseline = numericTriggerField(trigger, ['rollingAverage', 'rollingMean', 'rollingMedian', 'baselineValue', 'previousValue']);
  if (baseline === undefined || baseline === 0) {
    return false;
  }

  return Math.abs(value - baseline) / Math.abs(baseline) >= 0.35;
}

function numericTriggerField(trigger: Record<string, unknown>, names: string[]): number | undefined {
  for (const name of names) {
    const value = trigger[name];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
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

export function buildRestockAlertEmail(
  notification: RestockAlertEmailNotification,
  baseUrl: string,
  now: string
): TransactionalEmailMessage {
  const itemUrl = notification.itemUrl ?? buildProductUrl(baseUrl, notification.productId);
  const lines = [
    `${notification.productName} is available again at ${notification.storeName}.`,
    '',
    `Open item: ${itemUrl}`,
    '',
    `Sent at: ${now}`
  ];

  return {
    to: notification.recipientEmail,
    subject: `${notification.productName} is back in stock`,
    text: lines.join('\n'),
    metadata: {
      type: 'restock',
      productId: notification.productId,
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
