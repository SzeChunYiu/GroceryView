import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { Catch, type ArgumentsHost } from '@nestjs/common';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost): void {
    Sentry.captureException(exception);
    super.catch(exception as Error, host);
  }
}
