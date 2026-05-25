'use client';

import { useState } from 'react';
import {
  applyCommunityReviewVote,
  communityReviewTrustScore,
  defaultCommunityPriceReviews,
  moderationStatusLabel,
  reportCommunityPriceReview,
  sortCommunityReviewsByTrust,
  type CommunityPriceReview,
  type CommunityReviewVote
} from '@/lib/reviews';
import { COMMUNITY_REVIEW_PROMPT_COPY } from '@/lib/community-reviews';
import { ReviewPromptForm } from '@/components/review-prompt-form';
import { sourceDiscrepancyReviewContract } from '@/lib/verified-data';

type ReviewStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type ReviewDecision = 'approve' | 'hide' | 'escalate';
type ApiReviewDecision = 'approve' | 'reject' | 'needs_more_info';
const dismissCommunityReportAction = 'dismiss_community_report';
type ReviewModerationAction = ReviewDecision;
type Assignment = { id: string; reviewId?: string; subjectType?: 'product_match' | 'community_report' | 'commodity_mapping' | 'price_report' | 'duplicate_product_report' | 'source_discrepancy_report'; subjectId?: string; priority?: string; reason?: string; assigneeId?: string; dueAt?: string; status?: string };
type AssignmentResponse = { assignments?: Assignment[]; sla?: { status?: string; overdueAssignments?: number; breachedReviewIds?: string[] } };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function PriceReportReviewActions() {
  const [assignmentId, setAssignmentId] = useState('');
  const [communityReviews, setCommunityReviews] = useState<CommunityPriceReview[]>(() => sortCommunityReviewsByTrust(defaultCommunityPriceReviews));
  const [notes, setNotes] = useState('Verified community price evidence against source material.');
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [message, setMessage] = useState('No anonymous price-report moderation. Sign in first as a registered reviewer.');
  const [queue, setQueue] = useState<AssignmentResponse | null>(null);

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous price-report moderation or community report decisions are sent.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function loadAssignments() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/human-review/assignments?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Human review queue was rejected. Session user is not a registered human reviewer or the repository is unavailable.');
      return;
    }
    const body = (await response.json()) as AssignmentResponse;
    setQueue(body);
    const firstAssignment = body.assignments?.[0];
    if (firstAssignment?.id) setAssignmentId(firstAssignment.id);
    setStatus('ready');
    setMessage(`Loaded ${body.assignments?.length ?? 0} reviewer assignments with SLA ${body.sla?.status ?? 'unknown'}.`);
  }

  async function decideReview(decision: ReviewDecision) {
    const session = requireSession();
    if (!session || !assignmentId.trim()) return;
    const { accessToken, userId } = session;
    const apiDecision: ApiReviewDecision = decision === 'hide' ? 'reject' : decision === 'escalate' ? 'needs_more_info' : 'approve';
    const response = await fetch(`/api/human-review/assignments/${encodeURIComponent(assignmentId)}/decisions?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ decision: apiDecision, notes: `${decision}: ${notes}` })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Reviewer decision was rejected by the production API.');
      return;
    }
    setStatus('ready');
    setMessage(`${decision} action accepted with reviewedByHuman: true writeback. Hide maps to dismiss_community_report/reject, escalate maps to needs_more_info with assignment status in_progress, and approve keeps the existing accept_community_report / approve_commodity_mapping writebacks.`);
  }

  async function voteCommunityReview(reviewId: string, vote: CommunityReviewVote) {
    setCommunityReviews((currentReviews) => applyCommunityReviewVote(currentReviews, reviewId, vote));
    const response = await fetch('/api/reviews/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reviewId, vote })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Community review vote was rejected. Refresh before trying again.');
      return;
    }
    const body = await response.json() as { reviews?: CommunityPriceReview[] };
    if (body.reviews) setCommunityReviews(sortCommunityReviewsByTrust(body.reviews));
    setStatus('ready');
    setMessage(`${vote === 'upvote' ? 'Helpful' : 'Not helpful'} vote saved. Most trusted community price reviews are sorted first.`);
  }

  function reportSuspiciousReview(reviewId: string) {
    setCommunityReviews((currentReviews) =>
      reportCommunityPriceReview(currentReviews, reviewId, 'Community flagged suspicious price evidence or review content.')
    );
    setStatus('ready');
    setMessage('Suspicious community price report flagged. Moderation status is visible here and in the unified /admin/reviews queue.');
  }

  function moderateCommunityReview(reviewId: string, action: ReviewModerationAction) {
    setCommunityReviews((currentReviews) => sortCommunityReviewsByTrust(currentReviews.map((review) => {
      if (review.id !== reviewId) return review;
      if (action === 'approve') return { ...review, moderationStatus: 'active', lastReportReason: 'Moderator approved this review for shopper-visible trust scoring.' };
      if (action === 'hide') return { ...review, moderationStatus: 'dismissed', lastReportReason: 'Moderator hid this review from shopper-facing trust scoring.' };
      return {
        ...review,
        moderationStatus: 'under_review',
        reportCount: Math.max(2, (review.reportCount ?? 0) + 1),
        lastReportReason: 'Moderator escalated this review for a senior evidence check.'
      };
    })));
    setStatus('ready');
    setMessage(`${action === 'approve' ? 'Approve' : action === 'hide' ? 'Hide' : 'Escalate'} action staged locally for ${reviewId}; submit the matching human-review decision for the protected writeback.`);
  }

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-white p-5 shadow-sm" aria-label="Price report human review controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Signed-in reviewer actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Community price-report review queue</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage bearer token to load protected human-review assignments and submit moderator decisions. The public page stays fail-closed; only registered reviewers can approve product matches, community reports, price reports, duplicate product reports, or commodity_mapping tasks.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-sky-800 px-4 py-2 text-sm font-black text-white" onClick={loadAssignments} type="button">Load signed-in review queue</button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <label className="text-sm font-black text-slate-950" htmlFor="review-assignment-id">
          Assignment id
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="review-assignment-id"
            onChange={(event) => setAssignmentId(event.target.value)}
            placeholder="human review assignment id"
            value={assignmentId}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="review-notes">
          Reviewer notes
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="review-notes"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" disabled={!assignmentId.trim()} onClick={() => decideReview('approve')} type="button">Approve evidence</button>
        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" disabled={!assignmentId.trim()} onClick={() => decideReview('hide')} type="button">Hide report</button>
        <button className="rounded-full border border-amber-300 px-4 py-2 text-sm font-black text-amber-900" disabled={!assignmentId.trim()} onClick={() => decideReview('escalate')} type="button">Request more info</button>
      </div>


      <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-4" aria-label="Source discrepancy review contract">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Source discrepancy reports</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Wrong price, wrong unit, missing image, and unavailable product queue</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Product-row reports post to {sourceDiscrepancyReviewContract.protectedEndpoint} and enter {sourceDiscrepancyReviewContract.queue} as {sourceDiscrepancyReviewContract.subjectType}.
        </p>
        <ul className="mt-3 grid gap-2 lg:grid-cols-3">
          {sourceDiscrepancyReviewContract.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-3 text-sm font-bold text-amber-950" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/70 p-4" aria-label="Community validation prompt review">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Community validation prompts</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{COMMUNITY_REVIEW_PROMPT_COPY.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{COMMUNITY_REVIEW_PROMPT_COPY.intro}</p>
        <div className="mt-4">
          <ReviewPromptForm productName="community price report product" />
        </div>
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-violet-950">{COMMUNITY_REVIEW_PROMPT_COPY.guardrail}</p>
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4" aria-label="Community review helpfulness voting">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Community helpfulness voting</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Most trusted price reviews first</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Upvote useful price evidence or downvote noisy reports. The list is immediately re-ranked by trust score before shoppers use community contributions.
        </p>
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">
          {communityReviews.map((review) => (
            <li className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm shadow-sm" key={review.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{review.productName}</p>
                  <p className="mt-1 font-semibold text-slate-700">{review.priceLabel} · {review.storeName}</p>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">Trust {communityReviewTrustScore(review)}</p>
                  <p className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{moderationStatusLabel(review.moderationStatus)}</p>
                </div>
              </div>
              <p className="mt-3 text-slate-700">{review.body}</p>
              {review.lastReportReason ? (
                <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-950">
                  Report reason: {review.lastReportReason}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{review.reviewerLabel} · {review.upvotes} up · {review.downvotes} down</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-black text-emerald-900" onClick={() => voteCommunityReview(review.id, 'upvote')} type="button">Helpful</button>
                <button className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-700" onClick={() => voteCommunityReview(review.id, 'downvote')} type="button">Not helpful</button>
                <button className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-black text-amber-900" onClick={() => reportSuspiciousReview(review.id)} type="button">Report suspicious</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 border-t border-emerald-100 pt-3" aria-label={`Moderation actions for ${review.productName}`}>
                <button className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white" onClick={() => moderateCommunityReview(review.id, 'approve')} type="button">Approve</button>
                <button className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-black text-white" onClick={() => moderateCommunityReview(review.id, 'hide')} type="button">Hide</button>
                <button className="rounded-full bg-rose-700 px-3 py-1.5 text-xs font-black text-white" onClick={() => moderateCommunityReview(review.id, 'escalate')} type="button">Escalate</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {queue?.assignments?.length ? (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {queue.assignments.slice(0, 4).map((assignment) => (
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm" key={assignment.id}>
              <p className="font-black text-slate-950">{assignment.subjectType ?? 'community_report'} · {assignment.priority ?? 'priority'}</p>
              <p className="mt-1 text-slate-700">{assignment.reason ?? 'Needs human evidence review.'}</p>
              <p className="mt-1 text-slate-600">{assignment.id} · due {assignment.dueAt ?? 'unassigned due date'}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-950" data-status={status}>{message}</p>
    </section>
  );
}
