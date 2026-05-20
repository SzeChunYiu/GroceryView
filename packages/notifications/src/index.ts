export type DeliveryChannel = 'push' | 'email';

export type DeliveryNotification = {
  channel: DeliveryChannel;
  type: string;
  title: string;
  body: string;
  priority: 'normal' | 'high';
  sendAt: string;
  recipient: string;
};

export type ScheduledDeliveryNotification = DeliveryNotification & {
  id: string;
};

export type DeliveryMessage = {
  recipient: string;
  title: string;
  body: string;
  metadata: {
    type: string;
    priority: 'normal' | 'high';
    sendAt: string;
  };
};

export type NotificationProvider = {
  send(message: DeliveryMessage): Promise<string>;
};

export type NotificationProviders = Partial<Record<DeliveryChannel, NotificationProvider>>;

export type DeliveryResult =
  | {
      status: 'sent';
      channel: DeliveryChannel;
      recipient: string;
      providerMessageId: string;
    }
  | {
      status: 'skipped_not_due';
      channel: DeliveryChannel;
      recipient: string;
    }
  | {
      status: 'failed_no_provider';
      channel: DeliveryChannel;
      recipient: string;
      reason: string;
    }
  | {
      status: 'failed_provider_error';
      channel: DeliveryChannel;
      recipient: string;
      reason: string;
    };

export type DeliveryResultSummary = {
  total: number;
  sent: number;
  skipped: number;
  failedNoProvider: number;
  failedProviderError: number;
  failed: number;
};

export type DeliverDueNotificationsInput = {
  now: string;
  notifications: DeliveryNotification[];
  providers: NotificationProviders;
};

export type ScheduledNotificationStore = {
  loadDueNotifications(input: { now: string; limit: number }): Promise<ScheduledDeliveryNotification[]>;
  recordDeliveryResult(notificationId: string, result: DeliveryResult): Promise<void>;
};

export type ScheduledDeliveryResult = DeliveryResult & {
  notificationId: string;
};

export type RunScheduledNotificationDeliveryInput = {
  now: string;
  batchSize?: number;
  providers: NotificationProviders;
  store: ScheduledNotificationStore;
};

export type ScheduledNotificationDeliveryReport = {
  status: 'idle' | 'processed';
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  results: ScheduledDeliveryResult[];
};

function buildMessage(notification: DeliveryNotification): DeliveryMessage {
  return {
    recipient: notification.recipient,
    title: notification.title,
    body: notification.body,
    metadata: {
      type: notification.type,
      priority: notification.priority,
      sendAt: notification.sendAt
    }
  };
}

export function summarizeDeliveryResults(results: DeliveryResult[]): DeliveryResultSummary {
  return results.reduce<DeliveryResultSummary>(
    (summary, result) => {
      summary.total += 1;
      if (result.status === 'sent') summary.sent += 1;
      if (result.status === 'skipped_not_due') summary.skipped += 1;
      if (result.status === 'failed_no_provider') {
        summary.failedNoProvider += 1;
        summary.failed += 1;
      }
      if (result.status === 'failed_provider_error') {
        summary.failedProviderError += 1;
        summary.failed += 1;
      }
      return summary;
    },
    { total: 0, sent: 0, skipped: 0, failedNoProvider: 0, failedProviderError: 0, failed: 0 }
  );
}

function humanizeSubjectType(subjectType: HumanReviewSlaAssignment['subjectType']): string {
  return subjectType.replace('_', ' ');
}

function slaAlertBody(assignment: HumanReviewSlaAssignment, status: 'breached' | 'due soon'): string {
  return `Review ${assignment.reviewId} (${humanizeSubjectType(assignment.subjectType)}, ${assignment.priority} priority) assigned to ${assignment.assigneeId} is ${status}; due at ${assignment.dueAt}.`;
}

function slaNotification(
  assignment: HumanReviewSlaAssignment,
  recipient: HumanReviewSlaAlertRecipient,
  now: string,
  status: 'breached' | 'due soon'
): DeliveryNotification {
  return {
    channel: recipient.channel,
    type: status === 'breached' ? 'human_review_sla_breach' : 'human_review_sla_due_soon',
    title: status === 'breached' ? 'Human review SLA breached' : 'Human review SLA due soon',
    body: slaAlertBody(assignment, status),
    priority: 'high',
    sendAt: now,
    recipient: recipient.recipient
  };
}

export function planHumanReviewSlaNotifications(input: PlanHumanReviewSlaNotificationsInput): DeliveryNotification[] {
  const nowMs = Date.parse(input.now);
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  const dueSoonHours = input.dueSoonHours ?? 2;
  if (!Number.isFinite(dueSoonHours) || dueSoonHours <= 0) throw new Error('dueSoonHours must be positive.');

  const dueSoonMs = dueSoonHours * 60 * 60 * 1000;
  const notifications: DeliveryNotification[] = [];

  for (const assignment of input.assignments) {
    if (assignment.status === 'completed') continue;
    const dueAtMs = Date.parse(assignment.dueAt);
    if (Number.isNaN(dueAtMs)) throw new Error(`dueAt must be an ISO date for ${assignment.reviewId}.`);

    const status = dueAtMs < nowMs ? 'breached' : dueAtMs - nowMs <= dueSoonMs ? 'due soon' : null;
    if (status === null) continue;

    for (const recipient of input.recipients) {
      notifications.push(slaNotification(assignment, recipient, input.now, status));
    }
  }

  return notifications;
}

function suppressionMatches(notification: DeliveryNotification, suppression: NotificationSuppression): boolean {
  if (!suppression.active) return false;
  if (suppression.recipient !== notification.recipient) return false;
  return suppression.channel === undefined || suppression.channel === notification.channel;
}

export function applyNotificationSuppressions(input: {
  notifications: DeliveryNotification[];
  suppressions: NotificationSuppression[];
}): NotificationSuppressionResult {
  const sendable: DeliveryNotification[] = [];
  const suppressed: NotificationSuppressionResult['suppressed'] = [];

  for (const notification of input.notifications) {
    const suppression = input.suppressions.find((candidate) => suppressionMatches(notification, candidate));
    if (suppression) {
      suppressed.push({ notification, reason: suppression.reason });
      continue;
    }
    sendable.push(notification);
  }

  return { sendable, suppressed };
}

function suppressionReasonForEvent(eventType: NotificationSuppressionEventType): NotificationSuppressionReason {
  if (eventType === 'unsubscribe' || eventType === 'resubscribe') return 'unsubscribed';
  if (eventType === 'bounce') return 'bounce';
  return 'complaint';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isoFromUnixSeconds(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return new Date(value * 1000).toISOString();
}

function validIsoOrFallback(value: string | undefined, fallback: string): string {
  const candidate = value ?? fallback;
  if (Number.isNaN(Date.parse(candidate))) throw new Error('receivedAt must be an ISO date.');
  return candidate;
}

function providerEventId(record: Record<string, unknown>, keys: string[], fallbackParts: string[]): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value) return value;
  }
  return fallbackParts.filter(Boolean).join(':');
}

function parseSendgridSuppressionWebhook(input: ParseNotificationSuppressionWebhookInput): NotificationSuppressionEvent[] {
  const records = Array.isArray(input.payload) ? input.payload : [input.payload];
  const eventTypes: Record<string, NotificationSuppressionEventType> = {
    bounce: 'bounce',
    'spam report': 'complaint',
    unsubscribe: 'unsubscribe',
    group_unsubscribe: 'unsubscribe',
    group_resubscribe: 'resubscribe'
  };
  const events: NotificationSuppressionEvent[] = [];

  for (const raw of records) {
    if (!isRecord(raw)) continue;
    const eventName = readString(raw, 'event');
    const eventType = eventName ? eventTypes[eventName] : undefined;
    const recipient = readString(raw, 'email');
    if (!eventType || !recipient) continue;

    const occurredAt = validIsoOrFallback(isoFromUnixSeconds(raw.timestamp), input.receivedAt);
    events.push({
      provider: 'sendgrid',
      providerEventId: providerEventId(raw, ['sg_event_id'], [readString(raw, 'sg_message_id') ?? '', recipient, eventName ?? '', occurredAt]),
      eventType,
      recipient,
      channel: 'email',
      occurredAt
    });
  }

  return events;
}

function parseSesMessage(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  const message = readString(payload, 'Message');
  if (!message) return payload;
  try {
    return JSON.parse(message) as unknown;
  } catch {
    return payload;
  }
}

function parseSesSuppressionWebhook(input: ParseNotificationSuppressionWebhookInput): NotificationSuppressionEvent[] {
  const record = parseSesMessage(input.payload);
  if (!isRecord(record)) return [];

  const eventName = readString(record, 'eventType') ?? readString(record, 'notificationType');
  const eventType: NotificationSuppressionEventType | undefined =
    eventName === 'Bounce' ? 'bounce' : eventName === 'Complaint' ? 'complaint' : undefined;
  if (!eventType) return [];

  const detail = isRecord(record[eventType]) ? record[eventType] : undefined;
  const recipientsKey = eventType === 'bounce' ? 'bouncedRecipients' : 'complainedRecipients';
  const recipients = Array.isArray(detail?.[recipientsKey]) ? detail[recipientsKey] : [];
  const mail = isRecord(record.mail) ? record.mail : {};
  const occurredAt = validIsoOrFallback(readString(detail ?? {}, 'timestamp') ?? readString(mail, 'timestamp'), input.receivedAt);
  const feedbackId = readString(detail ?? {}, 'feedbackId');
  const messageId = readString(mail, 'messageId');

  return recipients.flatMap((recipient, index) => {
    if (!isRecord(recipient)) return [];
    const email = readString(recipient, 'emailAddress');
    if (!email) return [];
    return [{
      provider: 'ses',
      providerEventId: feedbackId ?? [messageId ?? 'ses-message', eventName ?? eventType, String(index), email].join(':'),
      eventType,
      recipient: email,
      channel: 'email',
      occurredAt
    }];
  });
}

function expoReceiptRecords(payload: unknown): Array<{ receiptId: string; record: Record<string, unknown> }> {
  if (Array.isArray(payload)) {
    return payload.flatMap((record, index) => (isRecord(record) ? [{ receiptId: readString(record, 'id') ?? `expo-receipt-${index}`, record }] : []));
  }

  if (!isRecord(payload)) return [];
  const receipts = isRecord(payload.receipts) ? payload.receipts : payload;
  return Object.entries(receipts).flatMap(([receiptId, record]) => (isRecord(record) ? [{ receiptId, record }] : []));
}

function parseExpoSuppressionWebhook(input: ParseNotificationSuppressionWebhookInput): NotificationSuppressionEvent[] {
  const events: NotificationSuppressionEvent[] = [];
  for (const { receiptId, record } of expoReceiptRecords(input.payload)) {
    const status = readString(record, 'status');
    const details = isRecord(record.details) ? record.details : {};
    const error = readString(details, 'error') ?? readString(record, 'error');
    const recipient = readString(record, 'to') ?? readString(record, 'recipient') ?? readString(record, 'pushToken');

    if (status !== 'error' || error !== 'DeviceNotRegistered' || !recipient) continue;

    events.push({
      provider: 'expo',
      providerEventId: providerEventId(record, ['id'], [receiptId, recipient, error]),
      eventType: 'unsubscribe',
      recipient,
      channel: 'push',
      occurredAt: validIsoOrFallback(readString(record, 'occurredAt'), input.receivedAt)
    });
  }
  return events;
}

export function parseNotificationSuppressionWebhook(
  input: ParseNotificationSuppressionWebhookInput
): NotificationSuppressionEvent[] {
  if (Number.isNaN(Date.parse(input.receivedAt))) throw new Error('receivedAt must be an ISO date.');
  if (input.provider === 'sendgrid') return parseSendgridSuppressionWebhook(input);
  if (input.provider === 'ses') return parseSesSuppressionWebhook(input);
  return parseExpoSuppressionWebhook(input);
}

export function processNotificationSuppressionEvent(event: NotificationSuppressionEvent): NotificationSuppressionMutation {
  if (Number.isNaN(Date.parse(event.occurredAt))) throw new Error('occurredAt must be an ISO date.');

  return {
    id: `suppression-${event.provider}-${event.providerEventId}`,
    recipient: event.recipient,
    ...(event.channel ? { channel: event.channel } : {}),
    reason: suppressionReasonForEvent(event.eventType),
    active: event.eventType !== 'resubscribe',
    updatedAt: event.occurredAt,
    source: {
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventType: event.eventType
    }
  };
}

export async function deliverDueNotifications(input: DeliverDueNotificationsInput): Promise<DeliveryResult[]> {
  const now = Date.parse(input.now);
  if (Number.isNaN(now)) throw new Error('now must be an ISO date.');

  const results: DeliveryResult[] = [];

  for (const notification of input.notifications) {
    const sendAt = Date.parse(notification.sendAt);
    if (Number.isNaN(sendAt)) throw new Error('notification sendAt must be an ISO date.');

    if (sendAt > now) {
      results.push({ status: 'skipped_not_due', channel: notification.channel, recipient: notification.recipient });
      continue;
    }

    const provider = input.providers[notification.channel];
    if (!provider) {
      results.push({
        status: 'failed_no_provider',
        channel: notification.channel,
        recipient: notification.recipient,
        reason: `No ${notification.channel} provider configured.`
      });
      continue;
    }

    try {
      const providerMessageId = await provider.send(buildMessage(notification));
      results.push({ status: 'sent', channel: notification.channel, recipient: notification.recipient, providerMessageId });
    } catch (error) {
      results.push({
        status: 'failed_provider_error',
        channel: notification.channel,
        recipient: notification.recipient,
        reason: error instanceof Error ? error.message : 'Unknown provider error.'
      });
    }
  }

  return results;
}

export async function runScheduledNotificationDelivery(input: RunScheduledNotificationDeliveryInput): Promise<ScheduledNotificationDeliveryReport> {
  const now = Date.parse(input.now);
  if (Number.isNaN(now)) throw new Error('now must be an ISO date.');

  const limit = input.batchSize ?? 100;
  if (!Number.isInteger(limit) || limit < 1) throw new Error('batchSize must be a positive integer.');

  const notifications = await input.store.loadDueNotifications({ now: input.now, limit });
  if (notifications.length === 0) {
    return { status: 'idle', processed: 0, sent: 0, failed: 0, skipped: 0, results: [] };
  }

  const deliveryResults = await deliverDueNotifications({
    now: input.now,
    notifications,
    providers: input.providers
  });

  const results: ScheduledDeliveryResult[] = [];
  for (const [index, result] of deliveryResults.entries()) {
    const notificationId = notifications[index]?.id;
    if (!notificationId) throw new Error('delivery result is missing its source notification.');

    await input.store.recordDeliveryResult(notificationId, result);
    results.push({ ...result, notificationId });
  }

  return {
    status: 'processed',
    processed: results.length,
    sent: results.filter((result) => result.status === 'sent').length,
    failed: results.filter((result) => result.status === 'failed_no_provider' || result.status === 'failed_provider_error').length,
    skipped: results.filter((result) => result.status === 'skipped_not_due').length,
    results
  };
}
