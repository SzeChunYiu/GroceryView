import { type RequestLoggingConfig } from './middleware/logger.js';

export type ApiConfig = {
  requestLogging: RequestLoggingConfig;
};

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    requestLogging: {
      enabled: parseBooleanFlag(env.REQUEST_LOGGING_ENABLED, true),
      serviceName: env.API_SERVICE_NAME?.trim() || 'groceryview-api'
    }
  };
}
