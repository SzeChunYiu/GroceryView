import type { NextFunction, Request, Response } from 'express';
import { type NestMiddleware } from '@nestjs/common';
import { logger, requestIdFrom } from '../lib/logger.js';

const normalizeHeader = (value: string | string[] | undefined) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

const getClientIp = (req: Request): string => {
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim();
  if (req.ip) return req.ip;
  return req.socket.remoteAddress ?? 'unknown';
};

const getRequestId = (req: Request) => {
  return requestIdFrom({
    'x-request-id': normalizeHeader(req.headers['x-request-id']) ?? normalizeHeader(req.headers['x-amzn-trace-id']),
    'x-amzn-trace-id': normalizeHeader(req.headers['x-amzn-trace-id']),
    traceparent: normalizeHeader(req.headers['traceparent'])
  });
};

export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = process.hrtime.bigint();
    const requestId = getRequestId(req);
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      logger.info(
        {
          event: 'http.request',
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          responseTimeMs: isNaN(durationMs) ? 0 : Math.round(durationMs),
          ip: getClientIp(req),
          userAgent: normalizeHeader(req.headers['user-agent'])
        },
        `${req.method} ${req.path}`
      );
    });

    next();
  }
}
