import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken } from '@groceryview/auth';
import { createPostgresRepository, type QueryExecutor } from '@groceryview/db';
import type { HumanReviewAssignment } from '@groceryview/core';
import { createHttpHandler, type AuthOptions } from '../index.js';

type HumanReviewRepository = NonNullable<AuthOptions['humanReviewRepository']>;

type QueryCall = { text: string; values: unknown[] };

type HumanReviewAssignmentRow = {
  id: string;
  review_id: string;
  subject_type: HumanReviewAssignment['subjectType'];
  subject_id: string;
  priority: HumanReviewAssignment['priority'];
  reason: string;
  assignee_id: string;
  assigned_at: string;
  due_at: string;
  status: HumanReviewAssignment['status'];
};

function createQueryCountHarness(rows: HumanReviewAssignmentRow[]): QueryExecutor & { selectCalls(): QueryCall[] } {
  const calls: QueryCall[] = [];
  return {
    selectCalls() {
      return calls.filter((call) => /^\s*select\b/i.test(call.text));
    },
    async query<T>(text: string, values: unknown[] = []): Promise<T[]> {
      calls.push({ text, values });
      if (/from\s+human_review_assignments/i.test(text)) return rows as T[];
      throw new Error(`Unexpected query in N+1 harness: ${text}`);
    }
  };
}

function createRepositoryWithCountedAssignmentList(db: QueryExecutor): HumanReviewRepository {
  const repository = createPostgresRepository(db);
  return {
    async getHumanReviewer(reviewerId) {
      return { id: reviewerId, role: 'moderator' as const, active: true };
    },
    listOpenHumanReviewAssignments: () => repository.listOpenHumanReviewAssignments(),
    saveHumanReviewAssignment: (assignment) => repository.saveHumanReviewAssignment(assignment)
  };
}

async function authHeader(userId: string) {
  const token = await createSessionToken({ userId, expiresAt: '2099-01-01T00:00:00.000Z' }, 'secret');
  return { authorization: `Bearer ${token}` };
}

describe('N+1 query guards', () => {
  it('lists human-review assignments with one SELECT regardless of row count', async () => {
    const db = createQueryCountHarness([
      {
        id: 'assignment-product-match',
        review_id: 'review-product-match',
        subject_type: 'product_match',
        subject_id: 'match-1',
        priority: 'high',
        reason: 'Low-confidence product match.',
        assignee_id: 'moderator-1',
        assigned_at: '2026-05-19T10:00:00.000Z',
        due_at: '2026-05-19T12:00:00.000Z',
        status: 'assigned'
      },
      {
        id: 'assignment-community-report',
        review_id: 'review-community-report',
        subject_type: 'community_report',
        subject_id: 'report-1',
        priority: 'medium',
        reason: 'Community price report needs evidence review.',
        assignee_id: 'moderator-1',
        assigned_at: '2026-05-19T10:05:00.000Z',
        due_at: '2026-05-19T13:00:00.000Z',
        status: 'assigned'
      },
      {
        id: 'assignment-commodity-mapping',
        review_id: 'review-commodity-mapping',
        subject_type: 'commodity_mapping',
        subject_id: 'commodity-1',
        priority: 'low',
        reason: 'Commodity alias needs curator confirmation.',
        assignee_id: 'moderator-1',
        assigned_at: '2026-05-19T10:10:00.000Z',
        due_at: '2026-05-19T14:00:00.000Z',
        status: 'in_progress'
      }
    ]);
    const handle = createHttpHandler(undefined, {
      authSecret: 'secret',
      now: new Date('2026-05-19T12:30:00.000Z'),
      humanReviewRepository: createRepositoryWithCountedAssignmentList(db)
    });

    const response = await handle(new Request('http://localhost/api/human-review/assignments', {
      headers: await authHeader('moderator-1')
    }));

    assert.equal(response.status, 200);
    const body = await response.json() as { assignments: Array<{ id: string }> };
    assert.deepEqual(body.assignments.map((assignment) => assignment.id), [
      'assignment-product-match',
      'assignment-community-report',
      'assignment-commodity-mapping'
    ]);
    assert.equal(db.selectCalls().length, 1);
    assert.match(db.selectCalls()[0]?.text ?? '', /from\s+human_review_assignments/i);
    assert.deepEqual(db.selectCalls()[0]?.values, []);
  });
});
