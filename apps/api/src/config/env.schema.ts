type ApiEnvironment = {
  API_SERVICE_NAME?: string;
  NODE_ENV: string;
  PORT?: string;
  REQUEST_LOGGING_ENABLED?: string;
};

export function validateEnvironment(config: Record<string, unknown>): ApiEnvironment {
  const port = config.PORT;
  if (port !== undefined && (!/^\d+$/.test(String(port)) || Number(port) <= 0)) {
    throw new Error('PORT must be a positive integer.');
  }
  const requestLoggingEnabled = config.REQUEST_LOGGING_ENABLED;
  if (
    requestLoggingEnabled !== undefined &&
    !['1', '0', 'true', 'false', 'yes', 'no', 'on', 'off'].includes(String(requestLoggingEnabled).trim().toLowerCase())
  ) {
    throw new Error('REQUEST_LOGGING_ENABLED must be a boolean flag.');
  }

  return {
    API_SERVICE_NAME: config.API_SERVICE_NAME === undefined ? undefined : String(config.API_SERVICE_NAME),
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    PORT: port === undefined ? undefined : String(port),
    REQUEST_LOGGING_ENABLED: requestLoggingEnabled === undefined ? undefined : String(requestLoggingEnabled)
  };
}
