import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().regex(/^\d+$/).optional(),
    DATABASE_URL: z.string().optional(),
  })
  .passthrough();

export function validateEnvironment(config: Record<string, unknown>) {
  return environmentSchema.parse(config);
}
