import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { buildOpenApiDocument, createHttpHandler, GROCERYVIEW_API_VERSION, GROCERYVIEW_OPENAPI_VERSION } from '../src/index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

function assertMatchesSchema<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    assert.fail(`${label} failed schema validation: ${result.error.message}`);
  }
  return result.data;
}

const versionRequestSchema = z.object({
  includeRuntime: z.boolean().optional()
}).strict();

const versionResponseSchema = z.object({
  service: z.literal('groceryview-server'),
  apiVersion: z.literal(GROCERYVIEW_API_VERSION),
  openApiVersion: z.literal(GROCERYVIEW_OPENAPI_VERSION),
  runtime: z.object({
    environment: z.enum(['development', 'test', 'production'])
  }).strict().optional()
}).strict();

const errorResponseSchema = z.object({
  error: z.string().trim().min(1)
}).strict();

describe('version API contract', () => {
  it('validates the 200 request schema and response shape', async () => {
    const request = assertMatchesSchema(versionRequestSchema, { includeRuntime: true }, 'version request');
    const handle = createHttpHandler(undefined, {
      runtimeConfig: {
        nodeEnv: 'test',
        port: 3000
      }
    });

    const response = await handle(new Request(`http://localhost/api/version?includeRuntime=${String(request.includeRuntime)}`));
    assert.equal(response.status, 200);
    const body = assertMatchesSchema(versionResponseSchema, await json(response), 'version response');

    assert.equal(body.apiVersion, buildOpenApiDocument().info.version);
    assert.equal(body.openApiVersion, buildOpenApiDocument().openapi);
    assert.deepEqual(body.runtime, { environment: 'test' });
  });

  it('returns a 400 error envelope when the query violates the Zod request contract', async () => {
    const invalidRequest = versionRequestSchema.safeParse({ includeRuntime: 'yes' });
    assert.equal(invalidRequest.success, false);

    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/version?includeRuntime=yes'));

    assert.equal(response.status, 400);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '400 response');
    assert.match(body.error, /includeRuntime must be true or false/i);
  });

  it('returns a 404 error envelope for unknown version resources', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/version/unknown'));

    assert.equal(response.status, 404);
    const body = assertMatchesSchema(errorResponseSchema, await json(response), '404 response');
    assert.match(body.error, /Route not found/i);
  });

  it('keeps 429 out of the version contract until rate limiting applies', () => {
    const doc = buildOpenApiDocument();
    const operation = doc.paths['/api/version']?.get;

    assert.ok(operation, '/api/version should be present in OpenAPI');
    assert.equal(operation.responses?.['429'], undefined);
  });
});
