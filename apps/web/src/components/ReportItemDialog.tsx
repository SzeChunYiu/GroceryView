'use client';

import { FormEvent, useState } from 'react';
import { reportItemEndpoint } from '@groceryview/api';

type Issue = 'wrong_category' | 'wrong_image' | 'incorrect_name';

type ReportItemDialogProps = {
  itemCode: string;
  itemName: string;
};

type ReportResponse = {
  status?: 'accepted' | 'queued';
  reviewQueue?: {
    assigneeId?: string;
    priority?: string;
  };
};

const issueOptions: ReadonlyArray<{ value: Issue; label: string; hint: string }> = [
  { value: 'wrong_category', label: 'Wrong category', hint: 'The product category is wrong.' },
  { value: 'wrong_image', label: 'Wrong image', hint: 'Product image or gallery is wrong.' },
  { value: 'incorrect_name', label: 'Incorrect name', hint: 'Name is misspelled or incorrect.' }
];

function toUrl(itemId: string): string {
  const rawPath = reportItemEndpoint.path.replace(':itemId', encodeURIComponent(itemId));
  const serverBase = (process.env.NEXT_PUBLIC_GROCERYVIEW_SERVER_URL ?? '').trim();
  if (!serverBase) return rawPath;
  try {
    return new URL(rawPath, serverBase).toString();
  } catch {
    return rawPath;
  }
}

export function ReportItemDialog({ itemCode, itemName }: Readonly<ReportItemDialogProps>) {
  const [issue, setIssue] = useState<Issue>('incorrect_name');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('Submitting your report...');

    try {
      const body = { issue, ...(details.trim() ? { details: details.trim() } : {}) };
      const response = await fetch(toUrl(itemCode), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        setMessage('Report submission failed. Try again in a minute.');
        return;
      }

      const payload = (await response.json()) as ReportResponse;
      const statusText = payload.status === 'accepted' ? 'was accepted and queued for admin review.' : 'was queued for review.';
      const assignee = payload.reviewQueue?.assigneeId || 'an assigned reviewer';
      const priority = payload.reviewQueue?.priority || 'normal';
      setMessage(`Thanks for reporting ${itemName}. ${statusText} Assigned reviewer: ${assignee}. Priority: ${priority}.`);
      setDetails('');
      setOpen(false);
    } catch {
      setMessage('Report submission failed due to a network issue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-market-mint/30 bg-white p-6">
      <button
        className="rounded-full bg-market-ink px-4 py-2 text-sm font-black text-white"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? 'Cancel report' : 'Report item information'}
      </button>

      {open ? (
        <form className="mt-4 space-y-4" onSubmit={submitReport}>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-market-ink/70">This item: {itemName}</p>
          <p className="font-black text-slate-950">Why is this item wrong?</p>
          <div className="space-y-2">
            {issueOptions.map((entry) => (
              <label className="flex gap-2 text-sm font-semibold text-slate-800" key={entry.value}>
                <input
                  checked={issue === entry.value}
                  disabled={busy}
                  name="item-issue"
                  onChange={() => setIssue(entry.value)}
                  type="radio"
                  value={entry.value}
                />
                <span>
                  <span className="font-black">{entry.label}:</span> {entry.hint}
                </span>
              </label>
            ))}
          </div>
          <label className="block text-sm font-black text-slate-800" htmlFor={`report-item-details-${itemCode}`}>
            Optional details
            <textarea
              className="mt-2 h-24 w-full rounded-md border border-slate-200 p-3 text-sm"
              disabled={busy}
              id={`report-item-details-${itemCode}`}
              onChange={(event) => setDetails(event.target.value)}
              value={details}
            />
          </label>
          <button
            className="rounded-full bg-sky-700 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-sky-400"
            disabled={busy || !issue}
            type="submit"
          >
            {busy ? 'Submitting...' : 'Send report to admin review'}
          </button>
          <p className="rounded-md bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-950">{message || 'No anonymous reports are stored in shopper profiles.'}</p>
        </form>
      ) : (
        <p className="mt-3 rounded-md bg-market-oat/45 p-4 text-sm">{message || 'Help us improve this item page. Report wrong category, image, or name via admin review queue.'}</p>
      )}
    </section>
  );
}
