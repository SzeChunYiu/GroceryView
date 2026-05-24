import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import { allowedOrigins } from '../config.js';

const allowedOriginSet = new Set<string>(allowedOrigins);

export function isOriginAllowed(origin: string | undefined): boolean {
  return origin === undefined || allowedOriginSet.has(origin);
}

export function buildCorsOptions(): CorsOptions {
  return {
    origin(origin, callback) {
      callback(null, isOriginAllowed(origin));
    }
  };
}
