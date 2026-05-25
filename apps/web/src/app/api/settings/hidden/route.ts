import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const hiddenSettingsSchema = z.object({
  hiddenProductIds: z.array(z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/)).max(100).default([]),
  hiddenStoreIds: z.array(z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/)).max(100).default([])
}).strict();

function hiddenSettingsPayload(hiddenProductIds: string[] = [], hiddenStoreIds: string[] = []) {
  return {
    hiddenProductIds: [...new Set(hiddenProductIds)],
    hiddenStoreIds: [...new Set(hiddenStoreIds)],
    saved: true,
    source: 'settings_hidden_picker_contract'
  };
}

export async function GET() {
  return NextResponse.json(hiddenSettingsPayload());
}

export async function PATCH(request: Request) {
  const parsed = hiddenSettingsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_hidden_settings_payload',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  return NextResponse.json(hiddenSettingsPayload(parsed.data.hiddenProductIds, parsed.data.hiddenStoreIds));
}

export const POST = PATCH;
