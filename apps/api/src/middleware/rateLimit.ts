import { rateLimit } from 'express-rate-limit';
import type { ApiRateLimitConfig } from '../config.js';

export function createRateLimitMiddleware(config: ApiRateLimitConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    message: {
      error: config.message
    }
  });
}
