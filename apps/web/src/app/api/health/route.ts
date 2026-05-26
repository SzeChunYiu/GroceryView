import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';
import { pingDatabase } from '@/lib/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: packageJson.version,
    time: new Date().toISOString(),
    db: await pingDatabase()
  });
}
