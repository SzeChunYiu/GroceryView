import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const suggestRequestSchema = z.object({
  q: z.string().trim().min(1)
}).strict();

const suggestionSchema = z.object({
  type: z.enum(['product', 'category']),
  label: z.string().trim().min(1),
  href: z.string().trim().startsWith('/'),
  slug: z.string().trim().min(1),
  score: z.number().int().min(0),
  match: z.enum(['prefix', 'word-prefix', 'contains']),
  detail: z.string().trim().min(1).optional()
}).strict();

const suggestResponseSchema = z.object({
  query: z.string().trim().min(1),
  suggestions: z.array(suggestionSchema),
  limit: z.number().int().positive(),
  source: z.literal('verified product and category snapshots')
}).strict();

const suggestErrorResponseSchema = z.object({
  error: z.string().trim().min(1),
  query: z.string(),
  suggestions: z.array(suggestionSchema).length(0)
}).strict();

const suggestResponses: Partial<Record<200 | 400 | 404 | 429, z.ZodTypeAny>> = {
  200: suggestResponseSchema,
  400: suggestErrorResponseSchema
};

function suggestResponse(status: keyof typeof suggestResponses, body: unknown) {
  const schema = suggestResponses[status];
  assert.ok(schema, `suggest contract must define status ${status}`);
  return { status, body: schema.parse(body) };
}

describe('suggest API contract', () => {
  it('validates the request Zod schema and 200 response shape', () => {
    assert.deepEqual(suggestRequestSchema.parse({ q: 'kaffe' }), { q: 'kaffe' });
    assert.equal(suggestRequestSchema.safeParse({ q: '' }).success, false);
    assert.equal(suggestRequestSchema.safeParse({ q: 'kaffe', page: 2 }).success, false);

    const responseBody = suggestResponseSchema.parse({
      query: 'kaffe',
      suggestions: [
        {
          type: 'product',
          label: 'Bryggkaffe Mellanrost',
          href: '/products/bryggkaffe-mellanrost',
          slug: 'bryggkaffe-mellanrost',
          score: 0,
          match: 'prefix',
          detail: 'Gevalia'
        },
        {
          type: 'category',
          label: 'Kaffe, te och kakao',
          href: '/categories/kaffe-te-kakao',
          slug: 'kaffe-te-kakao',
          score: 1,
          match: 'word-prefix',
          detail: '42 verified rows'
        }
      ],
      limit: 10,
      source: 'verified product and category snapshots'
    });

    assert.equal(suggestResponses[200], suggestResponseSchema);
    assert.deepEqual(responseBody.suggestions.map((suggestion) => suggestion.type), ['product', 'category']);
  });

  it('validates the 400 response shape for an empty q parameter', () => {
    const body = suggestErrorResponseSchema.parse({
      error: 'q query parameter must be at least 1 character.',
      query: '',
      suggestions: []
    });

    assert.equal(suggestResponses[400], suggestErrorResponseSchema);
    assert.match(body.error, /q query parameter/i);
  });

  it('treats no-match queries as an empty 200 instead of a 404 resource lookup', () => {
    const request = suggestRequestSchema.parse({ q: 'zzzxxy-no-match' });
    const response = suggestResponse(200, {
      query: request.q,
      suggestions: [],
      limit: 10,
      source: 'verified product and category snapshots'
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.suggestions, []);
    assert.equal(suggestResponses[404], undefined, 'suggest has no per-resource 404 contract');
  });

  it('keeps 429 out of the suggest contract until a rate limiter exists', () => {
    assert.equal(suggestResponses[429], undefined);
  });
});
