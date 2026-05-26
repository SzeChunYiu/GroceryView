import { NextResponse, type NextRequest } from 'next/server';

import {
  communityModerationQueue,
  moderationPriorityLabel,
  moderationQueueTypeLabel,
  moderationStatusLabel,
  type CommunityModerationQueueItem
} from '@/lib/reviews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ModerationAction = 'resolve' | 'ignore';
type ModerationDecision = {
  action: ModerationAction;
  note: string;
  decidedAt: string;
  decidedBy: string;
};

type ModerationQueueRecord = CommunityModerationQueueItem & {
  decision?: ModerationDecision;
};

let moderationQueue: ModerationQueueRecord[] = communityModerationQueue.map((item) => ({ ...item }));

function summarizeQueue(items: readonly ModerationQueueRecord[]) {
  return {
    total: items.length,
    pending: items.filter((item) => item.status === 'reported' || item.status === 'under_review').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
    ignored: items.filter((item) => item.status === 'ignored').length,
    flaggedReviews: items.filter((item) => item.type === 'flagged_review').length,
    flaggedListComments: items.filter((item) => item.type === 'flagged_list_comment').length,
    highPriority: items.filter((item) => item.priority === 'high' && (item.status === 'reported' || item.status === 'under_review')).length
  };
}

function serializeItem(item: ModerationQueueRecord) {
  return {
    ...item,
    labels: {
      action: item.actionLabel,
      priority: moderationPriorityLabel(item.priority),
      status: moderationStatusLabel(item.status),
      type: moderationQueueTypeLabel(item.type)
    }
  };
}

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  return request.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

function isModerationAction(value: unknown): value is ModerationAction {
  return value === 'resolve' || value === 'ignore';
}

export async function GET() {
  return NextResponse.json({
    actions: ['resolve', 'ignore'],
    items: moderationQueue.map(serializeItem),
    summary: summarizeQueue(moderationQueue)
  });
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const action = body.action;
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const decidedBy = typeof body.moderator === 'string' && body.moderator.trim()
    ? body.moderator.trim()
    : 'admin';

  if (!id || !isModerationAction(action)) {
    return NextResponse.json({ error: 'id and action=resolve|ignore are required.' }, { status: 400 });
  }

  const existing = moderationQueue.find((item) => item.id === id);
  if (!existing) {
    return NextResponse.json({ error: 'Moderation queue item not found.' }, { status: 404 });
  }

  const decision: ModerationDecision = {
    action,
    note,
    decidedAt: new Date().toISOString(),
    decidedBy
  };

  moderationQueue = moderationQueue.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      decision,
      status: action === 'resolve' ? 'resolved' : 'ignored'
    };
  });

  const item = moderationQueue.find((entry) => entry.id === id)!;
  return NextResponse.json({
    action,
    item: serializeItem(item),
    summary: summarizeQueue(moderationQueue)
  });
}
