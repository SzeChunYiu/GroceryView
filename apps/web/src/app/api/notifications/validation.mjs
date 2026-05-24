import { z } from 'zod';

const notificationTopicSchema = z.enum([
  'price_drop',
  'weekly_digest',
  'watchlist_alert',
  'receipt_review'
]);

const hhMmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm in 24-hour time.');

export const notificationQuerySchema = z.object({
  userId: z.string().trim().min(1, 'userId is required.'),
  includeMuted: z.enum(['true', 'false']).optional().transform((value) => value === 'true')
}).strict();

export const notificationPreferenceBodySchema = z.object({
  userId: z.string().trim().min(1, 'userId is required.'),
  channel: z.enum(['email', 'push', 'telegram']),
  enabled: z.boolean(),
  topics: z.array(notificationTopicSchema).min(1, 'At least one notification topic is required.').max(10),
  quietHours: z.object({
    start: hhMmSchema,
    end: hhMmSchema,
    timezone: z.string().trim().min(1).default('Europe/Stockholm')
  }).optional()
}).strict();

export function formatZodIssues(issues) {
  return issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join('.'),
    message: issue.message
  }));
}
