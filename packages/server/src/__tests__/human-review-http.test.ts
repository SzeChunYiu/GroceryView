import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken } from '@groceryview/auth';
import type { HumanReviewAssignment } from '@groceryview/core';
import { createHttpHandler, type AuthOptions } from '../index.js';

type HumanReviewRepository = NonNullable<AuthOptions['humanReviewRepository']>;

function createHumanReviewRepository(): HumanReviewRepository {
  const reviewers = new Map([
    ['viewer-1', { id: 'viewer-1', role: 'viewer' as const, active: true }],
    ['moderator-1', { id: 'moderator-1', role: 'moderator' as const, active: true }],
    ['moderator-2', { id: 'moderator-2', role: 'moderator' as const, active: true }]
  ]);
  const assignments = new Map<string, HumanReviewAssignment>([
    [
      'assignment-review-match-1-moderator-1',
      {
        id: 'assignment-review-match-1-moderator-1',
        reviewId: 'review-match-1',
        subjectType: 'product_match' as const,
        subjectId: 'match-1',
        priority: 'high' as const,
        reason: 'Low-confidence produce match.',
        assigneeId: 'moderator-1',
        assignedAt: '2026-05-19T10:00:00.000Z',
        dueAt: '2026-05-19T12:00:00.000Z',
        status: 'assigned' as const
      }
    ]
  ]);

  return {
    async getHumanReviewer(reviewerId) {
      return reviewers.get(reviewerId) ?? null;
    },
    async listOpenHumanReviewAssignments() {
      return [...assignments.values()]
        .filter((assignment) => assignment.status !== 'completed')
        .map((assignment) => ({ ...assignment }));
    },
    async saveHumanReviewAssignment(assignment) {
      assignments.set(assignment.id, { ...assignment });
    }
  };
}

async function authHeader(userId: string) {
  const token = await createSessionToken({ userId, expiresAt: '2099-01-01T00:00:00.000Z' }, 'secret');
  return { authorization: `Bearer ${token}` };
}

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('human review HTTP routes', () => {
  it('lists open assignments with SLA status for registered reviewers', async () => {
    const handle = createHttpHandler(undefined, {
      authSecret: 'secret',
      now: new Date('2026-05-19T12:30:00.000Z'),
      humanReviewRepository: createHumanReviewRepository()
    });

    const unauthorized = await handle(new Request('http://localhost/api/human-review/assignments'));
    assert.equal(unauthorized.status, 401);

    const response = await handle(new Request('http://localhost/api/human-review/assignments', {
      headers: await authHeader('viewer-1')
    }));
    assert.equal(response.status, 200);
    const body = await json(response) as {
      assignments: Array<{ id: string }>;
      sla: { status: string; overdueAssignments: number; breachedReviewIds: string[] };
    };
    assert.deepEqual(body.assignments.map((assignment) => assignment.id), ['assignment-review-match-1-moderator-1']);
    assert.equal(body.sla.status, 'breached');
    assert.equal(body.sla.overdueAssignments, 1);
    assert.deepEqual(body.sla.breachedReviewIds, ['review-match-1']);
  });

  it('records assigned moderator decisions and completes approved assignments', async () => {
    const repository = createHumanReviewRepository();
    const handle = createHttpHandler(undefined, {
      authSecret: 'secret',
      now: new Date('2026-05-19T13:00:00.000Z'),
      humanReviewRepository: repository
    });

    const wrongModerator = await handle(new Request('http://localhost/api/human-review/assignments/assignment-review-match-1-moderator-1/decisions', {
      method: 'POST',
      headers: await authHeader('moderator-2'),
      body: JSON.stringify({ decision: 'approve' })
    }));
    assert.equal(wrongModerator.status, 403);

    const response = await handle(new Request('http://localhost/api/human-review/assignments/assignment-review-match-1-moderator-1/decisions', {
      method: 'POST',
      headers: await authHeader('moderator-1'),
      body: JSON.stringify({ decision: 'approve', notes: 'Verified against shelf photo.' })
    }));
    assert.equal(response.status, 202);
    const body = await json(response) as {
      decision: { status: string; reviewerId: string; writeback: { action: string; reviewedByHuman: boolean } };
      assignment: { status: string };
    };
    assert.equal(body.decision.status, 'approved');
    assert.equal(body.decision.reviewerId, 'moderator-1');
    assert.deepEqual(body.decision.writeback, {
      action: 'approve_product_match',
      subjectId: 'match-1',
      reviewedByHuman: true
    });
    assert.equal(body.assignment.status, 'completed');
    assert.deepEqual(await repository.listOpenHumanReviewAssignments(), []);
  });
});
