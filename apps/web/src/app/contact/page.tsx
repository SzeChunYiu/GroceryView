'use client';

import { FormEvent, useState } from 'react';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';

type ContactStatus = 'idle' | 'sending' | 'accepted' | 'error';

type ContactErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

function messageForError(status: number, body: ContactErrorBody, retryAfter: string | null) {
  const code = body.error?.code;
  if (status === 400) return body.error?.message ?? 'Please check the highlighted contact fields and try again.';
  if (status === 413) return 'Your message is over the 8 KiB contact limit. Please shorten it and try again.';
  if (status === 415) return 'Contact requests must be sent as JSON from this form.';
  if (status === 429) return `Too many contact attempts. Try again${retryAfter ? ` after ${retryAfter} seconds` : ' later'}.`;
  if (status === 503) return 'Contact intake is temporarily unavailable. Please try again later.';
  if (status >= 500) return 'Contact intake hit an unexpected error. Please try again later.';
  return code ? `${code}: ${body.error?.message ?? 'Contact request failed.'}` : 'Contact request failed.';
}

export default function ContactPage() {
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Send a message to GroceryView. We only use your email to respond to this request.');
  const [consentToContact, setConsentToContact] = useState(false);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('sending');
    setStatusMessage('Sending contact request…');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') ?? '').trim(),
          email: String(form.get('email') ?? '').trim(),
          subject: String(form.get('subject') ?? '').trim() || undefined,
          message: String(form.get('message') ?? '').trim(),
          consent: consentToContact,
          source: 'web'
        })
      });

      const body = await response.json().catch(() => ({}));
      if (response.status === 202) {
        setStatus('accepted');
        setStatusMessage(`Contact request accepted${body.requestId ? ` as ${body.requestId}` : ''}. We will reply by email if a response is needed.`);
        return;
      }

      setStatus('error');
      setStatusMessage(messageForError(response.status, body, response.headers.get('Retry-After')));
    } catch {
      setStatus('error');
      setStatusMessage('Contact request could not be sent from this browser. Please try again later.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Public contact</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Contact GroceryView</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            This form posts to <code className="rounded bg-emerald-50 px-1 py-0.5 text-emerald-900">POST /api/contact</code> with the documented public fields and never echoes your message text back into the page.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={submitContact}>
            <label className="grid gap-2 text-sm font-black text-slate-950">
              Name
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold" maxLength={120} name="name" required />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-950">
              Email
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold" maxLength={254} name="email" required type="email" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-950">
              Subject <span className="font-semibold text-slate-500">optional</span>
              <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold" maxLength={160} name="subject" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-950">
              Message
              <textarea className="min-h-40 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold" maxLength={4000} minLength={10} name="message" required />
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
              <input checked={consentToContact} className="mt-1" name="consentToContact" onChange={(event) => setConsentToContact(event.target.checked)} required type="checkbox" />
              I consent to GroceryView using my email to respond to this contact request.
            </label>
            <button className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={status === 'sending' || !consentToContact} type="submit">
              {status === 'sending' ? 'Sending…' : 'Send contact request'}
            </button>
          </form>
          <p aria-live="polite" className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-800" data-status={status}>{statusMessage}</p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
