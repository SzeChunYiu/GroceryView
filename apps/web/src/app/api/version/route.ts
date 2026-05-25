import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const versionPayload = {
  commit: process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ?? process.env.GIT_COMMIT_SHA
    ?? 'unknown',
  builtAt: process.env.GROCERYVIEW_BUILT_AT
    ?? process.env.NEXT_PUBLIC_GROCERYVIEW_BUILT_AT
    ?? process.env.BUILD_TIMESTAMP
    ?? 'unknown',
  env: process.env.VERCEL_ENV
    ?? process.env.NEXT_PUBLIC_VERCEL_ENV
    ?? process.env.NODE_ENV
    ?? 'unknown'
};

export function GET() {
  return NextResponse.json(versionPayload, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
