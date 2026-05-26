const requiredProductionWebEnv = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'GROCERYVIEW_PRODUCTION_URL',
  'LIST_SHARE_SECRET'
] as const;

const requiredProductionPublicWebEnv = [
  'NEXT_PUBLIC_LIST_SHARE_SECRET'
] as const;

function missingRequiredProductionEnv(env: NodeJS.ProcessEnv, keys: readonly string[]): string[] {
  if (env.NODE_ENV !== 'production') return [];
  return keys.filter((key) => !env[key]?.trim());
}

export function validateWebStartupEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = [
    ...missingRequiredProductionEnv(env, requiredProductionWebEnv),
    ...missingRequiredProductionEnv(env, requiredProductionPublicWebEnv)
  ];
  if (missing.length > 0) {
    throw new Error(`Missing required web environment variables: ${missing.join(', ')}`);
  }
}

validateWebStartupEnv();
