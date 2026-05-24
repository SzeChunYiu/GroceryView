import { INestApplication } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { SentryExceptionFilter } from './sentry.filter.js';
import { getSentryConfig } from '../../../sentry.config.js';

export async function createApp(): Promise<INestApplication> {
  const sentryConfig = getSentryConfig('api');

  if (sentryConfig) {
    Sentry.init(sentryConfig);

    process.on('unhandledRejection', (error) => {
      Sentry.captureException(error);
    });

    process.on('uncaughtException', (error) => {
      Sentry.captureException(error);
    });
  }

  const app = await NestFactory.create(AppModule);
  if (sentryConfig) {
    app.useGlobalFilters(new SentryExceptionFilter());
  }

  configureApp(app);
  return app;
}
