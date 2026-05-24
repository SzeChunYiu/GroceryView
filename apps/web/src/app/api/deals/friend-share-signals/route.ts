import { NextResponse } from 'next/server';
import { friendShareSignalFeed } from '@/lib/friend-share-signals';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(friendShareSignalFeed);
}
