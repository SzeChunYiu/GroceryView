type ApiEnvironment = {
  NODE_ENV: string;
  PORT?: string;
};

export function validateEnvironment(config: Record<string, unknown>): ApiEnvironment {
  const port = config.PORT;
  if (port !== undefined && (!/^\d+$/.test(String(port)) || Number(port) <= 0)) {
    throw new Error('PORT must be a positive integer.');
  }

  return {
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    PORT: port === undefined ? undefined : String(port)
  };
}
