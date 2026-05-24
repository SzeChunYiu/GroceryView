import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('suggest API contract', () => {
  it('validates suggestion query input and response shape', async () => {
    const handle = createHttpHandler();

    const ok = await handle(new Request('http://localhost/api/meal-plans/suggestions?userId=user-1&maxMealCost=120&servings=4'));
    assert.equal(ok.status, 200);
    const body = await json(ok) as {
      userId: string;
      suggestions: Array<{
        title: string;
        estimatedCost: number;
        estimatedCostPerServing: number;
        ingredientProductIds: string[];
      }>;
      ingredientProductIds: string[];
      guardrails: string[];
    };
    assert.equal(body.userId, 'user-1');
    assert.equal(Array.isArray(body.suggestions), true);
    assert.equal(typeof body.suggestions[0]?.title, 'string');
    assert.equal(typeof body.suggestions[0]?.estimatedCost, 'number');
    assert.equal(typeof body.suggestions[0]?.estimatedCostPerServing, 'number');
    assert.equal(Array.isArray(body.suggestions[0]?.ingredientProductIds), true);
    assert.equal(Array.isArray(body.ingredientProductIds), true);
    assert.equal(Array.isArray(body.guardrails), true);

    const invalidSchema = await handle(new Request('http://localhost/api/meal-plans/suggestions?userId=user-1&servings=0'));
    assert.equal(invalidSchema.status, 400);
    assert.match((await json(invalidSchema) as { error: string }).error, /servings must be positive/i);

    const missingUser = await handle(new Request('http://localhost/api/meal-plans/suggestions'));
    assert.equal(missingUser.status, 400);
    assert.match((await json(missingUser) as { error: string }).error, /userId query parameter/i);

    const notFound = await handle(new Request('http://localhost/api/suggest?userId=user-1'));
    assert.equal(notFound.status, 404);
    assert.match((await json(notFound) as { error: string }).error, /route not found/i);
  });
});
