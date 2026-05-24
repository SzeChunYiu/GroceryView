const productionRequiredWebEnvVars = [
  'DATABASE_URL',
  'LIST_SHARE_SECRET',
  'NEXT_PUBLIC_LIST_SHARE_SECRET'
] as const;

export type RequiredWebEnvironmentVariable = (typeof productionRequiredWebEnvVars)[number];

export type WebEnvironment = {
  databaseUrl?: string;
  listShareSecret?: string;
  publicListShareSecret?: string;
};

function isProduction(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV?.trim().toLowerCase() === 'production';
}

function missingEnvironmentVariables(env: NodeJS.ProcessEnv, keys: readonly string[]): string[] {
  return keys.filter((key) => !env[key]?.trim());
}

export function validateWebEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (!isProduction(env)) return;
  const missing = missingEnvironmentVariables(env, productionRequiredWebEnvVars);
  if (missing.length > 0) {
    throw new Error(`Missing required web environment variables: ${missing.join(', ')}. Copy .env.example and set production values before startup.`);
  }
}

export function loadWebEnvironment(env: NodeJS.ProcessEnv = process.env): WebEnvironment {
  validateWebEnvironment(env);
  return {
    databaseUrl: env.DATABASE_URL,
    listShareSecret: env.LIST_SHARE_SECRET,
    publicListShareSecret: env.NEXT_PUBLIC_LIST_SHARE_SECRET
  };
}
