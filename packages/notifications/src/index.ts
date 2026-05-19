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

export type DeliverDueNotificationsInput = {
  now: string;
  notifications: DeliveryNotification[];
  providers: NotificationProviders;
};

export type NotificationWorkerTask = {
  id: string;
  notification: DeliveryNotification;
  attemptCount: number;
  maxAttempts: number;
};

export type NotificationWorkerAcknowledgement =
  | {
      taskId: string;
      status: 'delivered';
      providerMessageId: string;
    }
  | {
      taskId: string;
      status: 'not_due';
    }
  | {
      taskId: string;
      status: 'retry_scheduled';
      attemptCount: number;
      nextAttemptAt: string;
      reason: string;
    }
  | {
      taskId: string;
      status: 'dead_lettered';
      attemptCount: number;
      reason: string;
    };

export type NotificationWorkerTickInput = {
  now: string;
  tasks: NotificationWorkerTask[];
  providers: NotificationProviders;
  retryDelayMinutes: number;
};

export type NotificationWorkerTickResult = {
  deliveries: DeliveryResult[];
  acknowledgements: NotificationWorkerAcknowledgement[];
  summary: {
    delivered: number;
    notDue: number;
    retryScheduled: number;
    deadLettered: number;
  };
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

function nextAttemptAt(now: string, retryDelayMinutes: number): string {
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  if (!Number.isFinite(retryDelayMinutes) || retryDelayMinutes <= 0) {
    throw new Error('retryDelayMinutes must be positive.');
  }
  return new Date(nowMs + retryDelayMinutes * 60_000).toISOString();
}

function deliveryReason(result: DeliveryResult): string {
  if (result.status === 'failed_no_provider' || result.status === 'failed_provider_error') return result.reason;
  return 'Notification was not delivered.';
}

export async function runNotificationWorkerTick(input: NotificationWorkerTickInput): Promise<NotificationWorkerTickResult> {
  const deliveries: DeliveryResult[] = [];
  const acknowledgements: NotificationWorkerAcknowledgement[] = [];
  const summary = { delivered: 0, notDue: 0, retryScheduled: 0, deadLettered: 0 };

  for (const task of input.tasks) {
    const [delivery] = await deliverDueNotifications({
      now: input.now,
      notifications: [task.notification],
      providers: input.providers
    });
    deliveries.push(delivery);

    if (delivery.status === 'sent') {
      acknowledgements.push({ taskId: task.id, status: 'delivered', providerMessageId: delivery.providerMessageId });
      summary.delivered += 1;
      continue;
    }

    if (delivery.status === 'skipped_not_due') {
      acknowledgements.push({ taskId: task.id, status: 'not_due' });
      summary.notDue += 1;
      continue;
    }

    const attemptCount = task.attemptCount + 1;
    const reason = deliveryReason(delivery);
    if (attemptCount >= task.maxAttempts) {
      acknowledgements.push({ taskId: task.id, status: 'dead_lettered', attemptCount, reason });
      summary.deadLettered += 1;
      continue;
    }

    acknowledgements.push({
      taskId: task.id,
      status: 'retry_scheduled',
      attemptCount,
      nextAttemptAt: nextAttemptAt(input.now, input.retryDelayMinutes),
      reason
    });
    summary.retryScheduled += 1;
  }

  return { deliveries, acknowledgements, summary };
}
