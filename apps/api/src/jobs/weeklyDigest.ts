import {
  listPersonalizedWeeklyDigestRecipients,
  type PersonalizedWeeklyDigestRecipient,
  type PersonalizedWeeklyDigestQueryExecutor
} from '@groceryview/db';
import {
  buildCheapestThisWeekDigestEmail,
  type TransactionalEmailClient
} from '../lib/email.js';
import type { CronJob } from './scheduler.js';

export type RunWeeklyCheapestDigestJobInput = {
  executor: PersonalizedWeeklyDigestQueryExecutor;
  emailClient: TransactionalEmailClient;
  baseUrl: string;
  now?: Date;
  since?: string;
  until?: string;
  limitPerUser?: number;
};

export type WeeklyCheapestDigestSent = {
  userId: string;
  recipientEmail: string;
  dealCount: number;
  messageId: string;
};

export type WeeklyCheapestDigestSkipped = {
  userId: string;
  recipientEmail: string;
  reason: 'no_deals';
};

export type WeeklyCheapestDigestJobResult = {
  sent: WeeklyCheapestDigestSent[];
  skipped: WeeklyCheapestDigestSkipped[];
};

export type CreateWeeklyCheapestDigestCronJobInput = Omit<RunWeeklyCheapestDigestJobInput, 'now'> & {
  expression?: string;
  name?: string;
  now?: () => Date;
};

const DEFAULT_WEEKLY_DIGEST_CRON = '0 8 * * 1';

export async function runWeeklyCheapestDigestJob(input: RunWeeklyCheapestDigestJobInput): Promise<WeeklyCheapestDigestJobResult> {
  const now = input.now ?? new Date();
  const until = input.until ?? now.toISOString();
  const since = input.since ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recipients = await listPersonalizedWeeklyDigestRecipients(input.executor, {
    since,
    until,
    limitPerUser: input.limitPerUser ?? 10
  });

  return sendWeeklyCheapestDigests({
    recipients,
    emailClient: input.emailClient,
    baseUrl: input.baseUrl,
    weekStart: since,
    weekEnd: until,
    generatedAt: now.toISOString()
  });
}

export function createWeeklyCheapestDigestCronJob(input: CreateWeeklyCheapestDigestCronJobInput): CronJob {
  return {
    name: input.name ?? 'weekly-cheapest-digest',
    expression: input.expression ?? DEFAULT_WEEKLY_DIGEST_CRON,
    run: async () => {
      await runWeeklyCheapestDigestJob({
        executor: input.executor,
        emailClient: input.emailClient,
        baseUrl: input.baseUrl,
        now: input.now?.(),
        since: input.since,
        until: input.until,
        limitPerUser: input.limitPerUser
      });
    }
  };
}

async function sendWeeklyCheapestDigests(input: {
  recipients: PersonalizedWeeklyDigestRecipient[];
  emailClient: TransactionalEmailClient;
  baseUrl: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
}): Promise<WeeklyCheapestDigestJobResult> {
  const sent: WeeklyCheapestDigestSent[] = [];
  const skipped: WeeklyCheapestDigestSkipped[] = [];

  for (const recipient of input.recipients) {
    if (recipient.deals.length === 0) {
      skipped.push({
        userId: recipient.userId,
        recipientEmail: recipient.email,
        reason: 'no_deals'
      });
      continue;
    }

    const messageId = await input.emailClient.send(buildCheapestThisWeekDigestEmail({
      recipientEmail: recipient.email,
      userId: recipient.userId,
      deals: recipient.deals,
      baseUrl: input.baseUrl,
      weekStart: input.weekStart,
      weekEnd: input.weekEnd,
      generatedAt: input.generatedAt
    }));

    sent.push({
      userId: recipient.userId,
      recipientEmail: recipient.email,
      dealCount: recipient.deals.length,
      messageId
    });
  }

  return { sent, skipped };
}
