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

export type TriggeredPriceAlertEmailSent = {
  recipientEmail: string;
  productId: string;
  messageId: string;
};

export type TriggeredPriceAlertEmailSkipped = {
  recipientEmail: string;
  productId: string;
  reason: 'not_price_threshold_alert';
};

export type NotifyTriggeredPriceAlertsResult = {
  sent: TriggeredPriceAlertEmailSent[];
  skipped: TriggeredPriceAlertEmailSkipped[];
};

type PriceAlertTrigger = Omit<WatchlistAlert['trigger'], 'metric' | 'threshold' | 'value'> & {
  baselineValue?: number;
  metric?: string;
  threshold?: number;
  value?: number | string;
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

export function isEmailNotifiablePriceAlert(alert: WatchlistAlert): boolean {
  if (alert.type !== 'target_price') {
    return false;
  }

  const trigger = alert.trigger as PriceAlertTrigger;
  return isAbsolutePriceTrigger(trigger) || isPercentageDropTrigger(trigger);
}

export function buildTriggeredPriceAlertEmail(
  notification: TriggeredPriceAlertEmailNotification,
  baseUrl: string,
  now: string
): TransactionalEmailMessage {
  const { alert } = notification;
  const itemUrl = notification.itemUrl ?? buildProductUrl(baseUrl, alert.productId);
  const trigger = alert.trigger as PriceAlertTrigger;
  const storeSuffix = trigger.storeName ? ` at ${trigger.storeName}` : '';

  const lines = [
    alert.message,
    '',
    `${isPercentageDropTrigger(trigger) ? 'Current drop' : 'Current price'}: ${formatTriggerValue(trigger)}${storeSuffix}`,
    `Alert threshold: ${formatAlertThreshold(trigger)}`,
    `Open item: ${itemUrl}`,
    '',
    `Sent at: ${now}`
  ];

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

function isAbsolutePriceTrigger(trigger: PriceAlertTrigger): boolean {
  return trigger.metric === 'price' && typeof trigger.value === 'number' && typeof trigger.threshold === 'number';
}

function isPercentageDropTrigger(trigger: PriceAlertTrigger): boolean {
  return trigger.metric === 'price_drop_percent' && typeof trigger.value === 'number' && typeof trigger.threshold === 'number';
}

function buildProductUrl(baseUrl: string, productId: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/product/${encodeURIComponent(productId)}`;
}

function formatAlertThreshold(trigger: PriceAlertTrigger): string {
  if (isPercentageDropTrigger(trigger)) {
    return typeof trigger.threshold === 'number' ? `${formatPercent(trigger.threshold)} cheaper` : 'not set';
  }

  return typeof trigger.threshold === 'number' ? formatSek(trigger.threshold) : 'not set';
}

function formatTriggerValue(trigger: PriceAlertTrigger): string {
  if (isPercentageDropTrigger(trigger) && typeof trigger.value === 'number') {
    return formatPercent(trigger.value);
  }

  return typeof trigger.value === 'number' ? formatSek(trigger.value) : String(trigger.value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

function formatSek(value: number): string {
  return `${value.toFixed(2)} SEK`;
}
