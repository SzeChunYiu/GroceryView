export type CronJob = {
  expression: string;
  name: string;
  run: () => Promise<void> | void;
};

export type ScheduledCronJob = CronJob & {
  nextRunAt: Date;
};

type Timer = ReturnType<typeof setTimeout>;

const MAX_LOOKAHEAD_MINUTES = 366 * 24 * 60;

export const NETTO_SWEDEN_SCRAPE_JOB_NAME = 'scrape:netto-se';
export const DEFAULT_NETTO_SWEDEN_DAILY_CRON = '10 4 * * *';

export function nettoSwedenDailyCron(env: NodeJS.ProcessEnv = process.env): string {
  return env.SCRAPER_CRON_NETTO_SE?.trim() || DEFAULT_NETTO_SWEDEN_DAILY_CRON;
}

function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  return field.split(',').some((part) => {
    const trimmed = part.trim();
    if (trimmed === '*') return true;
    if (trimmed.startsWith('*/')) {
      const step = Number(trimmed.slice(2));
      return Number.isInteger(step) && step > 0 && (value - min) % step === 0;
    }
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      return Number.isInteger(start) && Number.isInteger(end) && value >= start && value <= end;
    }
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed >= min && parsed <= max && parsed === value;
  });
}

export function cronMatches(expression: string, date: Date): boolean {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = expression.trim().split(/\s+/);
  if (!dayOfWeek) throw new Error(`Cron expression must have five fields: ${expression}`);

  return fieldMatches(minute, date.getMinutes(), 0, 59)
    && fieldMatches(hour, date.getHours(), 0, 23)
    && fieldMatches(dayOfMonth, date.getDate(), 1, 31)
    && fieldMatches(month, date.getMonth() + 1, 1, 12)
    && fieldMatches(dayOfWeek, date.getDay(), 0, 6);
}

export function nextCronRunAfter(expression: string, after = new Date()): Date {
  const candidate = new Date(after);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  for (let checked = 0; checked < MAX_LOOKAHEAD_MINUTES; checked += 1) {
    if (cronMatches(expression, candidate)) return new Date(candidate);
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  throw new Error(`No cron run found within ${MAX_LOOKAHEAD_MINUTES} minutes for ${expression}`);
}

export class CronScrapeScheduler {
  private readonly timers = new Map<string, Timer>();
  private readonly scheduled = new Map<string, ScheduledCronJob>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  list(): ScheduledCronJob[] {
    return [...this.scheduled.values()].sort((left, right) => left.nextRunAt.getTime() - right.nextRunAt.getTime());
  }

  start(jobs: readonly CronJob[]) {
    for (const job of jobs) this.schedule(job);
    return this.list();
  }

  stop() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.scheduled.clear();
  }

  private schedule(job: CronJob) {
    const existingTimer = this.timers.get(job.name);
    if (existingTimer) clearTimeout(existingTimer);
    const nextRunAt = nextCronRunAfter(job.expression, this.now());
    this.scheduled.set(job.name, { ...job, nextRunAt });
    const delayMs = Math.max(0, nextRunAt.getTime() - this.now().getTime());

    this.timers.set(job.name, setTimeout(async () => {
      try {
        await job.run();
      } finally {
        this.schedule(job);
      }
    }, delayMs));
  }
}
