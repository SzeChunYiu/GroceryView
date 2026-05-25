'use client';

import { useState } from 'react';
import {
  applyCommunityReviewVote,
  communityReviewTrustScore,
  defaultCommunityPriceReviews,
  sortCommunityReviewsByTrust,
  type CommunityPriceReview,
  type CommunityReviewVote
} from '@/lib/reviews';
import { COMMUNITY_REVIEW_PROMPT_COPY, COMMUNITY_REVIEW_PROMPTS } from '@/lib/community-reviews';
import { priceAnomalyReviewWorkflow } from '@/lib/price-events';

type ReviewStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type ReviewDecision = 'approve' | 'reject' | 'needs_more_info';
type Assignment = { id: string; reviewId?: string; subjectType?: 'product_match' | 'community_report' | 'commodity_mapping' | 'price_anomaly'; subjectId?: string; priority?: string; reason?: string; assigneeId?: string; dueAt?: string; status?: string };
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
    const response = await fetch(`/api/human-review/assignments/${encodeURIComponent(assignmentId)}/decisions?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ decision, notes })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Reviewer decision was rejected by the production API.');
      return;
    }
    setStatus('ready');
    setMessage(`${decision} decision accepted with reviewedByHuman: true writeback. needs_more_info leaves assignment status in_progress; community_report approvals map to accept_community_report and rejections map to dismiss_community_report; commodity_mapping approvals map to approve_commodity_mapping and rejections map to reject_commodity_mapping.`);
  }

  async function decidePriceAnomaly(priceAnomalyStatus: 'verified' | 'quarantined') {
    const session = requireSession();
    if (!session || !assignmentId.trim()) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/human-review/assignments/${encodeURIComponent(assignmentId)}/decisions?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        decision: priceAnomalyStatus === 'verified' ? 'approve' : 'reject',
        notes,
        subjectType: priceAnomalyReviewWorkflow.subjectType,
        priceAnomalyStatus,
        canHighlightDeal: priceAnomalyStatus === 'verified'
      })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Price anomaly review decision was rejected by the production API.');
      return;
    }
    setStatus('ready');
    setMessage(priceAnomalyStatus === 'verified'
      ? 'Price anomaly verified; deal highlighting can resume after human_price_anomaly_review writeback.'
      : 'Price anomaly quarantined; deal highlighting remains blocked to prevent false savings claims.');
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

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-white p-5 shadow-sm" aria-label="Price report human review controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Signed-in reviewer actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Community price-report review queue</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage bearer token to load protected human-review assignments and submit moderator decisions. The public page stays fail-closed; only registered reviewers can approve product matches, community reports, or commodity_mapping tasks.
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
        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" disabled={!assignmentId.trim()} onClick={() => decideReview('reject')} type="button">Reject evidence</button>
        <button className="rounded-full border border-amber-300 px-4 py-2 text-sm font-black text-amber-900" disabled={!assignmentId.trim()} onClick={() => decideReview('needs_more_info')} type="button">Request more info</button>
      </div>

      <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/80 p-4" aria-label="Price anomaly review workflow">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-800">Price anomaly review</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">Verify or quarantine extreme price changes</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Assignments with subjectType {priceAnomalyReviewWorkflow.subjectType} stay blocked from deal highlights until a reviewer confirms the shelf price or quarantines the event as a likely scraper error.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-black text-rose-900" disabled={!assignmentId.trim()} onClick={() => decidePriceAnomaly('verified')} type="button">Verify anomaly price</button>
          <button className="rounded-full bg-rose-900 px-4 py-2 text-sm font-black text-white" disabled={!assignmentId.trim()} onClick={() => decidePriceAnomaly('quarantined')} type="button">Quarantine false savings</button>
        </div>
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-rose-950">
          {priceAnomalyReviewWorkflow.guardrails.join(' ')}
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/80 p-4" aria-label="Community review prompts">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Community validation prompts</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{COMMUNITY_REVIEW_PROMPT_COPY.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{COMMUNITY_REVIEW_PROMPT_COPY.intro}</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {COMMUNITY_REVIEW_PROMPTS.map((prompt) => (
            <fieldset className="rounded-2xl border border-violet-100 bg-white p-4 text-sm shadow-sm" key={prompt.id}>
              <legend className="font-black text-slate-950">{prompt.label}</legend>
              <p className="mt-2 font-semibold leading-6 text-slate-700">{prompt.question}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">{prompt.helper}</p>
              <label className="mt-3 block text-xs font-black uppercase tracking-[0.14em] text-violet-800" htmlFor={`${prompt.id}-rating`}>
                {prompt.lowLabel} ⇄ {prompt.highLabel}
              </label>
              <input
                aria-label={`${prompt.label} rating`}
                className="mt-2 w-full accent-violet-700"
                defaultValue="4"
                id={`${prompt.id}-rating`}
                max="5"
                min="1"
                name={prompt.id}
                type="range"
              />
              <p className="mt-2 rounded-xl bg-violet-50 p-3 text-xs font-bold text-violet-950">Trust signal: {prompt.trustReason}</p>
            </fieldset>
          ))}
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
                <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">Trust {communityReviewTrustScore(review)}</p>
              </div>
              <p className="mt-3 text-slate-700">{review.body}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{review.reviewerLabel} · {review.upvotes} up · {review.downvotes} down</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-black text-emerald-900" onClick={() => voteCommunityReview(review.id, 'upvote')} type="button">Helpful</button>
                <button className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-black text-slate-700" onClick={() => voteCommunityReview(review.id, 'downvote')} type="button">Not helpful</button>
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
