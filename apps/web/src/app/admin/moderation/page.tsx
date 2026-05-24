import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const moderationQueue = [
  {
    id: 'comment-spam-1',
    type: 'list comment',
    target: 'Budget taco list',
    reason: 'Spam link reported by 3 shoppers',
    reporterCount: 3,
    confidence: 'high'
  },
  {
    id: 'review-abuse-1',
    type: 'store review',
    target: 'Willys weekly basket review',
    reason: 'Abusive language reported by community filters',
    reporterCount: 2,
    confidence: 'medium'
  }
];

const moderationActions = [
  { action: 'resolve', copy: 'Hide the flagged content, keep the audit trail, and notify the reporter that moderation acted.' },
  { action: 'ignore', copy: 'Keep the content visible, record the review decision, and suppress duplicate report noise.' }
];

export function generateMetadata() {
  return routeMetadata('/admin/moderation');
}

export default function AdminModerationPage() {
  return (
    <PageShell>
      <Eyebrow>Admin moderation</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Reports and abuse queue</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Flagged list comments and store reviews are collected into one moderation queue so administrators can resolve abusive content or ignore false positives without losing an audit trail.
      </p>

      <Card className="mt-6 border-rose-200 bg-rose-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-800">Open reports</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{moderationQueue.length} items waiting for action</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Actions post to <code className="rounded bg-white/80 px-1 py-0.5 text-rose-900">/api/moderation</code> with the report id and either resolve or ignore.</p>
          </div>
          <div className="rounded-2xl bg-white/85 p-4 text-right shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-800">Trust guardrail</p>
            <p className="mt-2 text-2xl font-black text-rose-950">Audit every decision</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {moderationQueue.map((item) => (
          <Card className="border-slate-200" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{item.type}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{item.target}</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-black uppercase text-amber-950">{item.confidence}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{item.reason}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">{item.reporterCount} reporter signals · report id {item.id}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {moderationActions.map((moderationAction) => (
                <div className="rounded-2xl bg-slate-50 p-3" key={moderationAction.action}>
                  <p className="font-black capitalize text-slate-950">{moderationAction.action}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{moderationAction.copy}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
