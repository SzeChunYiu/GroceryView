import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const versionPayload = Object.freeze({
  commit: process.env.NEXT_PUBLIC_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? 'unknown',
  builtAt: process.env.NEXT_PUBLIC_BUILT_AT ?? process.env.BUILT_AT ?? process.env.BUILD_TIME ?? 'unknown',
  env: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown'
});

export async function GET() {
  return NextResponse.json(versionPayload, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
