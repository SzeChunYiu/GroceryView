import type { ScrapeSchedulerConfig } from '../config.js';
import { CronScrapeScheduler, scrapeCronJobName, type CronJob, type ScheduledCronJob } from './scheduler.js';

export type RetailerScrapeJob = {
  cadence: 'daily' | 'weekly';
  cron: string;
  retailer: string;
};

export type ScrapeQueueRunner = (job: RetailerScrapeJob) => Promise<void> | void;

export function jobsFromScrapeConfig(config: ScrapeSchedulerConfig): RetailerScrapeJob[] {
  return config.retailers.map((retailer) => ({
    cadence: retailer.cadence,
    cron: retailer.cron,
    retailer: retailer.id
  }));
}

export function cronJobsForScrapeQueue(config: ScrapeSchedulerConfig, runner: ScrapeQueueRunner): CronJob[] {
  if (!config.enabled) return [];
  return jobsFromScrapeConfig(config).map((job) => ({
    expression: job.cron,
    name: scrapeCronJobName(job.retailer),
    run: () => runner(job)
  }));
}

export function startScrapeQueueScheduler(
  config: ScrapeSchedulerConfig,
  runner: ScrapeQueueRunner,
  scheduler = new CronScrapeScheduler()
): ScheduledCronJob[] {
  return scheduler.start(cronJobsForScrapeQueue(config, runner));
}
