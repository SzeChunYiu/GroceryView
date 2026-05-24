import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import { isAllowedCorsOrigin } from '../config.js';

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback) => {
    if (origin === undefined) {
      callback(new Error('CORS policy violation: missing origin header'), false);
      return;
    }

    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS policy violation: ${origin} is not allowed`), false);
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204
};

export function createCorsOptions(): CorsOptions {
  return corsOptions;
}
