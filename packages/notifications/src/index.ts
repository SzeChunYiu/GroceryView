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
