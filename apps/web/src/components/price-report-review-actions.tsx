'use client';

import { useState } from 'react';

type ReviewStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type ReviewDecision = 'approve' | 'reject' | 'needs_more_info';
type Assignment = { id: string; reviewId?: string; subjectType?: 'product_match' | 'community_report' | 'commodity_mapping'; subjectId?: string; priority?: string; reason?: string; assigneeId?: string; dueAt?: string; status?: string };
type AssignmentResponse = { assignments?: Assignment[]; sla?: { status?: string; overdueAssignments?: number; breachedReviewIds?: string[] } };
type PriceReportReviewActionsProps = { productSlug?: string; productName?: string };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function PriceReportReviewActions({ productSlug = '', productName = '' }: Readonly<PriceReportReviewActionsProps>) {
  const [assignmentId, setAssignmentId] = useState('');
  const [notes, setNotes] = useState('Verified community price evidence against source material.');
  const [storeName, setStoreName] = useState('');
  const [observedPrice, setObservedPrice] = useState('');
  const [confidenceScore, setConfidenceScore] = useState('3');
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 10));
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

  async function submitLocalPrice() {
    setStatus('loading');
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productSlug,
        productName,
        storeName,
        observedPrice: Number(observedPrice),
        confidenceScore: Number(confidenceScore),
        observedAt
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus('error');
      setMessage(body.error ?? 'Local price report was rejected. Check store, price, confidence, and observation date.');
      return;
    }
    setStatus('ready');
    setMessage(`Community price report queued for review with confidence score ${body.review?.confidenceScore ?? confidenceScore}/5 at ${body.review?.storeName ?? storeName}.`);
    setObservedPrice('');
  }

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-white p-5 shadow-sm" aria-label="Community price report review controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Community price intelligence</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Submit a recent local price</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        Share store context, observation date, and a 1–5 confidence score so regional price differences can be reviewed before they influence GroceryView comparisons.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-black text-slate-950" htmlFor="community-price-store">
          Store context
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="community-price-store"
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="Store and area"
            value={storeName}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="community-price-observed">
          Price SEK
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="community-price-observed"
            min="0"
            onChange={(event) => setObservedPrice(event.target.value)}
            step="0.01"
            type="number"
            value={observedPrice}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="community-price-confidence">
          Confidence score
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="community-price-confidence"
            onChange={(event) => setConfidenceScore(event.target.value)}
            value={confidenceScore}
          >
            {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}/5</option>)}
          </select>
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="community-price-observed-at">
          Observed date
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="community-price-observed-at"
            onChange={(event) => setObservedAt(event.target.value)}
            type="date"
            value={observedAt}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" disabled={!productSlug || !storeName.trim() || !observedPrice.trim()} onClick={submitLocalPrice} type="button">Submit local price</button>
        <button className="rounded-full bg-sky-800 px-4 py-2 text-sm font-black text-white" onClick={loadAssignments} type="button">Load signed-in review queue</button>
      </div>

      <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-sky-800">Signed-in reviewer actions</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage bearer token to load protected human-review assignments and submit moderator decisions. The public page stays fail-closed; only registered reviewers can approve product matches, community reports, or commodity_mapping tasks.
      </p>
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
