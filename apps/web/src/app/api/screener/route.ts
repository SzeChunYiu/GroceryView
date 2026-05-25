import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const screenerParamsSchema = z.object({
  category: z.string().trim().min(1).default('all'),
  min_discount: z.coerce.number().min(0).max(100).default(0),
  sort: z.enum(['biggest-drop', 'cheapest-per-kg']).default('biggest-drop'),
});

const screenerParamsExamples = {
  happy: { category: 'fruit', min_discount: '20', sort: 'biggest-drop' },
  rejected: { category: 'fruit', min_discount: 'too-high', sort: 'random' },
} as const;

function parseScreenerParams(input: Record<string, unknown>) {
  const parsed = screenerParamsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'invalid_screener_params', issues: parsed.error.issues }, { status: 400 }),
    };
  }

  return { ok: true as const, params: parsed.data };
}

function queryParams(request: NextRequest) {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

export async function GET(request: NextRequest) {
  const parsed = parseScreenerParams(queryParams(request));
  if (!parsed.ok) return parsed.response;

  return NextResponse.json({ params: parsed.params });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = parseScreenerParams({ ...queryParams(request), ...(body && typeof body === 'object' && !Array.isArray(body) ? body : {}) });
  if (!parsed.ok) return parsed.response;

  return NextResponse.json({ params: parsed.params });
}
