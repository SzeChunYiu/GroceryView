import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module.js';
import { SentryExceptionFilter } from './sentry-exception.filter.js';
import { configureApp } from './configure-app.js';
import { getSentryConfig } from '../../sentry.config.js';

function initializeSentry() {
  const sentryConfig = getSentryConfig('api');
  if (!sentryConfig.enabled) {
    return;
  }

  Sentry.init({
    ...sentryConfig
  });

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
  });

  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
  });
}

export async function createApp(): Promise<INestApplication> {
  initializeSentry();

  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.useGlobalFilters(new SentryExceptionFilter(app.getHttpAdapter()));
  return app;
}
