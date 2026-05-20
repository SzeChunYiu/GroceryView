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

export type NotificationSuppressionReason = 'unsubscribed' | 'bounce' | 'complaint';

export type NotificationSuppression = {
  recipient: string;
  channel?: DeliveryChannel;
  reason: NotificationSuppressionReason;
  active: boolean;
};

export type NotificationSuppressionEventType = 'unsubscribe' | 'bounce' | 'complaint' | 'resubscribe';

export type NotificationSuppressionEvent = {
  provider: string;
  providerEventId: string;
  eventType: NotificationSuppressionEventType;
  recipient: string;
  channel?: DeliveryChannel;
  occurredAt: string;
};

export type NotificationSuppressionMutation = NotificationSuppression & {
  id: string;
  updatedAt: string;
  source: {
    provider: string;
    providerEventId: string;
    eventType: NotificationSuppressionEventType;
  };
};

export type NotificationSuppressionResult = {
  sendable: DeliveryNotification[];
  suppressed: Array<{
    notification: DeliveryNotification;
    reason: NotificationSuppressionReason;
  }>;
};

export type HumanReviewSlaAssignment = {
  reviewId: string;
  subjectType: 'product_match' | 'community_report';
  priority: 'high' | 'medium' | 'low';
  assigneeId: string;
  dueAt: string;
  status: 'assigned' | 'in_progress' | 'completed';
};

export type HumanReviewSlaAlertRecipient = {
  channel: DeliveryChannel;
  recipient: string;
};

export type PlanHumanReviewSlaNotificationsInput = {
  now: string;
  assignments: HumanReviewSlaAssignment[];
  recipients: HumanReviewSlaAlertRecipient[];
  dueSoonHours?: number;
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
      status: 'suppressed';
      reason: NotificationSuppressionReason;
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
  suppressions?: NotificationSuppression[];
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
    suppressed: number;
  };
};

export type NotificationOperationsReport = {
  status: 'healthy' | 'blocked';
  metrics: NotificationWorkerTickResult['summary'] & {
    providerFailures: number;
    staleDueTasks: number;
  };
  blockers: string[];
  warnings: string[];
  staleTaskIds: string[];
};

export type NotificationOperationsReportInput = {
  now: string;
  staleAfterMinutes: number;
  dueTasks: Array<{ id: string; sendAt: string }>;
  workerSummary: NotificationWorkerTickResult['summary'];
  deliveries: DeliveryResult[];
};

export type NotificationMetricsOptions = {
  service: string;
};

export type NotificationOperationsAlertInput = {
  now: string;
  report: NotificationOperationsReport;
  recipients: HumanReviewSlaAlertRecipient[];
};

export type NotificationProviderHealthStatus = 'pass' | 'fail' | 'not_run';

export type NotificationProviderReadinessInput = {
  requiredChannels: DeliveryChannel[];
  providers: Array<{
    channel: DeliveryChannel;
    providerName: string;
    configured: boolean;
    credentialsPresent: boolean;
    healthStatus: NotificationProviderHealthStatus;
  }>;
};

export type NotificationProviderReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

export type PersistedNotificationTask = {
  id: string;
  channel: DeliveryChannel;
  type: string;
  title: string;
  body: string;
  priority: 'normal' | 'high';
  sendAt: string;
  recipient: string;
  attemptCount: number;
  maxAttempts: number;
  status: 'queued' | 'delivered' | 'dead_lettered' | 'suppressed';
};

export type NotificationTaskRepository = {
  listDueNotificationTasks(now: string): Promise<PersistedNotificationTask[]>;
  listActiveNotificationSuppressions(): Promise<NotificationSuppression[]>;
  upsertNotificationTask(task: PersistedNotificationTask): Promise<void>;
};

export type RepositoryNotificationWorkerCycleInput = {
  now: string;
  retryDelayMinutes: number;
  staleAfterMinutes: number;
  repository: NotificationTaskRepository;
  providers: NotificationProviders;
  alertRecipients?: HumanReviewSlaAlertRecipient[];
};

export type RepositoryNotificationWorkerCycleResult = {
  dueTasks: PersistedNotificationTask[];
  suppressions: NotificationSuppression[];
  worker: NotificationWorkerTickResult;
  persistedTaskUpdates: PersistedNotificationTask[];
  report: NotificationOperationsReport;
  alerts: DeliveryNotification[];
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

export function buildNotificationProviderReadinessReport(
  input: NotificationProviderReadinessInput
): NotificationProviderReadinessReport {
  const blockers: string[] = [];
  const evidence: string[] = [];
  const warnings: string[] = [];
  const providersByChannel = new Map(input.providers.map((provider) => [provider.channel, provider]));

  for (const channel of input.requiredChannels) {
    const provider = providersByChannel.get(channel);

    if (!provider?.configured) {
      blockers.push(`notification_provider_not_configured:${channel}`);
    } else {
      evidence.push(`notification_provider_configured:${channel}:${provider.providerName}`);
    }

    if (!provider?.credentialsPresent) {
      blockers.push(`notification_provider_credentials_missing:${channel}`);
    } else {
      evidence.push(`notification_provider_credentials_present:${channel}`);
    }

    if (provider?.healthStatus === 'pass') {
      evidence.push(`notification_provider_health_pass:${channel}`);
    } else if (provider?.healthStatus === 'fail') {
      blockers.push(`notification_provider_health_failed:${channel}`);
    } else {
      blockers.push(`notification_provider_health_not_run:${channel}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    warnings,
    summary: blockers.length === 0 ? 'Notification providers are ready.' : 'Notification provider readiness is blocked.'
  };
}

export async function runNotificationWorkerTick(input: NotificationWorkerTickInput): Promise<NotificationWorkerTickResult> {
  const now = Date.parse(input.now);
  if (Number.isNaN(now)) throw new Error('now must be an ISO date.');

  const deliveries: DeliveryResult[] = [];
  const acknowledgements: NotificationWorkerAcknowledgement[] = [];
  const summary = { delivered: 0, notDue: 0, retryScheduled: 0, deadLettered: 0, suppressed: 0 };

  for (const task of input.tasks) {
    const sendAt = Date.parse(task.notification.sendAt);
    if (Number.isNaN(sendAt)) throw new Error('notification sendAt must be an ISO date.');

    if (sendAt <= now) {
      const suppression = (input.suppressions ?? []).find((candidate) => suppressionMatches(task.notification, candidate));
      if (suppression) {
        acknowledgements.push({ taskId: task.id, status: 'suppressed', reason: suppression.reason });
        summary.suppressed += 1;
        continue;
      }
    }

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

function persistedTaskToWorkerTask(task: PersistedNotificationTask): NotificationWorkerTask {
  return {
    id: task.id,
    notification: {
      channel: task.channel,
      type: task.type,
      title: task.title,
      body: task.body,
      priority: task.priority,
      sendAt: task.sendAt,
      recipient: task.recipient
    },
    attemptCount: task.attemptCount,
    maxAttempts: task.maxAttempts
  };
}

function applyWorkerAcknowledgementsToPersistedTasks(
  tasks: PersistedNotificationTask[],
  acknowledgements: NotificationWorkerAcknowledgement[]
): PersistedNotificationTask[] {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const updates: PersistedNotificationTask[] = [];

  for (const acknowledgement of acknowledgements) {
    const task = tasksById.get(acknowledgement.taskId);
    if (!task) throw new Error(`Unknown notification task acknowledgement: ${acknowledgement.taskId}.`);

    if (acknowledgement.status === 'not_due') continue;

    if (acknowledgement.status === 'delivered') {
      updates.push({ ...task, status: 'delivered' });
      continue;
    }

    if (acknowledgement.status === 'retry_scheduled') {
      updates.push({
        ...task,
        status: 'queued',
        attemptCount: acknowledgement.attemptCount,
        sendAt: acknowledgement.nextAttemptAt
      });
      continue;
    }

    if (acknowledgement.status === 'dead_lettered') {
      updates.push({ ...task, status: 'dead_lettered', attemptCount: acknowledgement.attemptCount });
      continue;
    }

    updates.push({ ...task, status: 'suppressed' });
  }

  return updates;
}

export async function runRepositoryNotificationWorkerCycle(
  input: RepositoryNotificationWorkerCycleInput
): Promise<RepositoryNotificationWorkerCycleResult> {
  const dueTasks = await input.repository.listDueNotificationTasks(input.now);
  const suppressions = await input.repository.listActiveNotificationSuppressions();
  const worker = await runNotificationWorkerTick({
    now: input.now,
    retryDelayMinutes: input.retryDelayMinutes,
    tasks: dueTasks.map(persistedTaskToWorkerTask),
    suppressions,
    providers: input.providers
  });

  const persistedTaskUpdates = applyWorkerAcknowledgementsToPersistedTasks(dueTasks, worker.acknowledgements);
  for (const task of persistedTaskUpdates) {
    await input.repository.upsertNotificationTask(task);
  }

  const report = buildNotificationOperationsReport({
    now: input.now,
    staleAfterMinutes: input.staleAfterMinutes,
    dueTasks: dueTasks.map((task) => ({ id: task.id, sendAt: task.sendAt })),
    workerSummary: worker.summary,
    deliveries: worker.deliveries
  });
  const alerts = planNotificationOperationsAlerts({
    now: input.now,
    report,
    recipients: input.alertRecipients ?? []
  });

  return { dueTasks, suppressions, worker, persistedTaskUpdates, report, alerts };
}

export function buildNotificationOperationsReport(input: NotificationOperationsReportInput): NotificationOperationsReport {
  const nowMs = Date.parse(input.now);
  if (Number.isNaN(nowMs)) throw new Error('now must be an ISO date.');
  if (!Number.isFinite(input.staleAfterMinutes) || input.staleAfterMinutes <= 0) {
    throw new Error('staleAfterMinutes must be positive.');
  }

  const staleAfterMs = input.staleAfterMinutes * 60_000;
  const staleTaskIds: string[] = [];
  for (const task of input.dueTasks) {
    const sendAtMs = Date.parse(task.sendAt);
    if (Number.isNaN(sendAtMs)) throw new Error(`sendAt must be an ISO date for ${task.id}.`);
    if (nowMs - sendAtMs > staleAfterMs) staleTaskIds.push(task.id);
  }

  const providerFailures = input.deliveries.filter(
    (delivery) => delivery.status === 'failed_no_provider' || delivery.status === 'failed_provider_error'
  ).length;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (input.workerSummary.deadLettered > 0) blockers.push('notification_dead_letters_present');
  if (providerFailures > 0) blockers.push('notification_provider_failures_present');
  if (staleTaskIds.length > 0) blockers.push('notification_due_queue_stale');
  if (input.workerSummary.retryScheduled > 0) warnings.push('notification_retries_scheduled');
  if (input.workerSummary.suppressed > 0) warnings.push('notification_suppressions_applied');

  return {
    status: blockers.length === 0 ? 'healthy' : 'blocked',
    metrics: {
      ...input.workerSummary,
      providerFailures,
      staleDueTasks: staleTaskIds.length
    },
    blockers,
    warnings,
    staleTaskIds
  };
}

function metricLabelValue(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

function serviceLabel(options: NotificationMetricsOptions): string {
  return `service="${metricLabelValue(options.service)}"`;
}

export function formatNotificationOperationsMetrics(
  report: NotificationOperationsReport,
  options: NotificationMetricsOptions
): string {
  const label = serviceLabel(options);
  return [
    '# HELP groceryview_notification_worker_events_total Notification worker event counts by status.',
    '# TYPE groceryview_notification_worker_events_total gauge',
    `groceryview_notification_worker_events_total{${label},status="delivered"} ${report.metrics.delivered}`,
    `groceryview_notification_worker_events_total{${label},status="not_due"} ${report.metrics.notDue}`,
    `groceryview_notification_worker_events_total{${label},status="retry_scheduled"} ${report.metrics.retryScheduled}`,
    `groceryview_notification_worker_events_total{${label},status="dead_lettered"} ${report.metrics.deadLettered}`,
    `groceryview_notification_worker_events_total{${label},status="suppressed"} ${report.metrics.suppressed}`,
    '# HELP groceryview_notification_provider_failures_total Notification provider failures in the worker cycle.',
    '# TYPE groceryview_notification_provider_failures_total gauge',
    `groceryview_notification_provider_failures_total{${label}} ${report.metrics.providerFailures}`,
    '# HELP groceryview_notification_stale_due_tasks_total Notification tasks already due beyond the stale threshold.',
    '# TYPE groceryview_notification_stale_due_tasks_total gauge',
    `groceryview_notification_stale_due_tasks_total{${label}} ${report.metrics.staleDueTasks}`,
    '# HELP groceryview_notification_operations_blocked Notification operations blocked status, 1 when blocked.',
    '# TYPE groceryview_notification_operations_blocked gauge',
    `groceryview_notification_operations_blocked{${label}} ${report.status === 'blocked' ? 1 : 0}`
  ].join('\n');
}

function notificationOperationsAlertBody(report: NotificationOperationsReport): string {
  const parts = [
    `Blockers: ${report.blockers.join(', ') || 'none'}.`,
    `Warnings: ${report.warnings.join(', ') || 'none'}.`,
    `Metrics: delivered=${report.metrics.delivered}, retryScheduled=${report.metrics.retryScheduled}, deadLettered=${report.metrics.deadLettered}, suppressed=${report.metrics.suppressed}, providerFailures=${report.metrics.providerFailures}, staleDueTasks=${report.metrics.staleDueTasks}.`
  ];
  if (report.staleTaskIds.length > 0) parts.push(`Stale task ids: ${report.staleTaskIds.join(', ')}.`);
  return parts.join(' ');
}

export function planNotificationOperationsAlerts(input: NotificationOperationsAlertInput): DeliveryNotification[] {
  if (Number.isNaN(Date.parse(input.now))) throw new Error('now must be an ISO date.');
  if (input.report.status === 'healthy') return [];

  const body = notificationOperationsAlertBody(input.report);
  return input.recipients.map((recipient) => ({
    channel: recipient.channel,
    type: 'notification_operations_blocked',
    title: 'Notification operations blocked',
    body,
    priority: 'high',
    sendAt: input.now,
    recipient: recipient.recipient
  }));
}
