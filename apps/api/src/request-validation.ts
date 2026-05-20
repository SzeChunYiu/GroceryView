import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const productSlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const watchlistItemSchema = z.object({
  productSlug: productSlugSchema,
  targetPrice: z.number().positive().optional(),
});

const basketItemSchema = z.object({
  productSlug: productSlugSchema,
  quantity: z.number().int().positive().max(99).optional(),
});

function parseRequestBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      message: 'Invalid request body',
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return parsed.data;
}

export type CreateWatchlistItemBody = z.infer<typeof watchlistItemSchema>;
export type CreateBasketItemBody = z.infer<typeof basketItemSchema>;

export function parseWatchlistItemBody(body: unknown): CreateWatchlistItemBody {
  return parseRequestBody(watchlistItemSchema, body);
}

export function parseBasketItemBody(body: unknown): CreateBasketItemBody {
  return parseRequestBody(basketItemSchema, body);
}
