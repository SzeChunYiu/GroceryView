import type { WatchlistAlert } from '@groceryview/core';
import { buildEmailUnsubscribeUrl, type TransactionalEmailClient, type TransactionalEmailMessage } from '../lib/email.js';

export type TriggeredPriceAlertEmailNotification = {
  recipientEmail: string;
  alert: WatchlistAlert;
  itemUrl?: string;
  userId?: string;
};

export type NotifyTriggeredPriceAlertsInput = {
  baseUrl: string;
  emailClient: TransactionalEmailClient;
  notifications: TriggeredPriceAlertEmailNotification[];
  now: string;
  unsubscribeTokenSecret?: string;
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

    const message = buildTriggeredPriceAlertEmail(notification, input.baseUrl, input.now, input.unsubscribeTokenSecret);
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
  now: string,
  unsubscribeTokenSecret?: string
): TransactionalEmailMessage {
  const { alert } = notification;
  const itemUrl = notification.itemUrl ?? buildProductUrl(baseUrl, alert.productId);
  const storeSuffix = alert.trigger.storeName ? ` at ${alert.trigger.storeName}` : '';
  const threshold = typeof alert.trigger.threshold === 'number' ? alert.trigger.threshold : undefined;
  const unsubscribeUrl = buildEmailUnsubscribeUrl(baseUrl, {
    recipientEmail: notification.recipientEmail,
    secret: unsubscribeTokenSecret,
    userId: notification.userId ?? notification.recipientEmail
  });

  const lines = [
    alert.message,
    '',
    `Current price: ${formatPriceValue(alert.trigger.value)}${storeSuffix}`,
    threshold === undefined ? undefined : `Alert threshold: ${formatSek(threshold)}`,
    `Open item: ${itemUrl}`,
    '',
    `Sent at: ${now}`,
    '',
    `Unsubscribe from GroceryView email alerts: ${unsubscribeUrl}`
  ].filter((line): line is string => typeof line === 'string');

  return {
    to: notification.recipientEmail,
    subject: `${alert.productName} price drop alert`,
    text: lines.join('\n'),
    metadata: {
      type: alert.type,
      productId: alert.productId,
      sendAt: now,
      unsubscribeUrl
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
