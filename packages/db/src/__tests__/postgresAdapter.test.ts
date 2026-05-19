import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresRepository, type QueryExecutor } from '../index.js';

class RecordingQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('select store_id')) return [{ store_id: 'willys-odenplan' }] as T[];
    if (sql.includes('select weekly_budget')) return [{ weekly_budget: '800', monthly_budget: '3200' }] as T[];
    if (sql.includes('from human_reviewers')) {
      return [{ id: 'moderator-1', role: 'moderator', active: true }] as T[];
    }
    if (sql.includes('from community_reporter_trust')) {
      return [
        {
          reporter_id: 'reporter-1',
          reports_last_24_hours: 7,
          pending_reports: 2,
          accepted_reports_last_30_days: 11,
          rejected_reports_last_30_days: 1,
          updated_at: '2026-05-19T20:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from human_review_assignments')) {
      return [
        {
          id: 'assignment-review-match-1-moderator-1',
          review_id: 'review-match-1',
          subject_type: 'product_match',
          subject_id: 'match-1',
          priority: 'high',
          reason: 'Low-confidence produce match.',
          assignee_id: 'moderator-1',
          assigned_at: '2026-05-19T10:00:00.000Z',
          due_at: '2026-05-19T14:00:00.000Z',
          status: 'assigned'
        }
      ] as T[];
    }
    return [] as T[];
  }
}

describe('createPostgresRepository', () => {
  it('uses parameterized SQL for user preferences and favorite stores', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertUser({ id: 'user-1', email: 'shopper@example.com' });
    await repo.addFavoriteStore('user-1', 'willys-odenplan');
    assert.deepEqual(await repo.getFavoriteStoreIds('user-1'), ['willys-odenplan']);
    await repo.upsertBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });
    assert.deepEqual(await repo.getBudget('user-1'), { weeklyBudget: 800, monthlyBudget: 3200 });

    assert.equal(executor.calls.every((call) => call.sql.includes('$') || call.sql.startsWith('select')), true);
    assert.deepEqual(executor.calls[0].params, ['user-1', 'shopper@example.com']);
  });

  it('persists and lists open human review assignments', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.saveHumanReviewAssignment({
      id: 'assignment-review-match-1-moderator-1',
      reviewId: 'review-match-1',
      subjectType: 'product_match',
      subjectId: 'match-1',
      priority: 'high',
      reason: 'Low-confidence produce match.',
      assigneeId: 'moderator-1',
      assignedAt: '2026-05-19T10:00:00.000Z',
      dueAt: '2026-05-19T14:00:00.000Z',
      status: 'assigned'
    });

    assert.deepEqual(await repo.listOpenHumanReviewAssignments(), [
      {
        id: 'assignment-review-match-1-moderator-1',
        reviewId: 'review-match-1',
        subjectType: 'product_match',
        subjectId: 'match-1',
        priority: 'high',
        reason: 'Low-confidence produce match.',
        assigneeId: 'moderator-1',
        assignedAt: '2026-05-19T10:00:00.000Z',
        dueAt: '2026-05-19T14:00:00.000Z',
        status: 'assigned'
      }
    ]);
    assert.deepEqual(executor.calls[0].params, [
      'assignment-review-match-1-moderator-1',
      'review-match-1',
      'product_match',
      'match-1',
      'high',
      'Low-confidence produce match.',
      'moderator-1',
      '2026-05-19T10:00:00.000Z',
      '2026-05-19T14:00:00.000Z',
      'assigned'
    ]);
  });

  it('persists and reads reviewer roles for permission checks', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertHumanReviewer({ id: 'moderator-1', role: 'moderator', active: true });

    assert.deepEqual(await repo.getHumanReviewer('moderator-1'), {
      id: 'moderator-1',
      role: 'moderator',
      active: true
    });
    assert.deepEqual(executor.calls[0].params, ['moderator-1', 'moderator', true]);
    assert.deepEqual(executor.calls[1].params, ['moderator-1']);
  });

  it('persists and reads community reporter trust state', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertCommunityReporterTrust({
      reporterId: 'reporter-1',
      reportsLast24Hours: 7,
      pendingReports: 2,
      acceptedReportsLast30Days: 11,
      rejectedReportsLast30Days: 1,
      updatedAt: '2026-05-19T20:00:00.000Z'
    });

    assert.deepEqual(await repo.getCommunityReporterTrust('reporter-1'), {
      reporterId: 'reporter-1',
      reportsLast24Hours: 7,
      pendingReports: 2,
      acceptedReportsLast30Days: 11,
      rejectedReportsLast30Days: 1,
      updatedAt: '2026-05-19T20:00:00.000Z'
    });
    assert.deepEqual(executor.calls[0].params, [
      'reporter-1',
      7,
      2,
      11,
      1,
      '2026-05-19T20:00:00.000Z'
    ]);
    assert.deepEqual(executor.calls[1].params, ['reporter-1']);
  });
});
