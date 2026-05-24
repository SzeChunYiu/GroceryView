import { NextResponse } from 'next/server';

type ModerationPayload = {
  action?: unknown;
  reportId?: unknown;
};

const validActions = new Set(['resolve', 'ignore']);

export function GET() {
  return NextResponse.json({
    queue: [
      { id: 'comment-spam-1', contentType: 'list-comment', status: 'pending', reporterCount: 3 },
      { id: 'review-abuse-1', contentType: 'review', status: 'pending', reporterCount: 2 }
    ],
    actions: ['resolve', 'ignore']
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ModerationPayload;
  const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : '';
  const action = typeof body.action === 'string' ? body.action.trim() : '';

  if (!reportId || !validActions.has(action)) {
    return NextResponse.json({ error: 'reportId and action (resolve or ignore) are required.' }, { status: 400 });
  }

  return NextResponse.json({
    reportId,
    action,
    status: action === 'resolve' ? 'resolved' : 'ignored',
    auditEvent: `moderation-${action}`
  });
}
