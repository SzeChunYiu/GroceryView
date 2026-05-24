import { randomUUID } from 'node:crypto';
import { type LoggerService, type LogLevel } from '@nestjs/common';
import pino, { type Logger } from 'pino';

const environment = process.env.NODE_ENV ?? 'development';

export const logger: Logger = pino({
  base: {
    app: 'groceryview-api',
    environment
  },
  level: process.env.LOG_LEVEL ?? (environment === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime
});

export function requestIdFrom(headers: Record<string, string | undefined>) {
  return (
    headers['x-request-id'] ??
    headers['x-amzn-trace-id'] ??
    headers['traceparent'] ??
    randomUUID()
  );
}

export class PinoNestLogger implements LoggerService {
  log(message: unknown, context?: string) {
    logger.info({ context }, message);
  }

  error(message: unknown, trace?: string, context?: string) {
    logger.error({ context, trace }, message);
  }

  warn(message: unknown, context?: string) {
    logger.warn({ context }, message);
  }

  debug(message: unknown, context?: string) {
    logger.debug({ context }, message);
  }

  verbose(message: unknown, context?: string) {
    logger.debug({ context }, message);
  }

  fatal(message: unknown, context?: string, trace?: string) {
    logger.fatal({ context, trace }, message);
  }

  setLogLevels(_levels: LogLevel[]) {}
}
