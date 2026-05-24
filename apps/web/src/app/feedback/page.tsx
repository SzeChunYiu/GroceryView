'use client';

import { FormEvent, useState } from 'react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

type SubmissionState = 'idle' | 'sending' | 'success' | 'error';

type FeedbackSubmissionStatus = {
  state: SubmissionState;
  message: string;
  messageId?: string;
};

export function generateMetadata() {
  return routeMetadata('/feedback');
}

const initialStatus = 'Share your question or feedback and we will send it to the support inbox.';

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FeedbackSubmissionStatus>({ state: 'idle', message: initialStatus });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: 'sending', message: 'Sending your support message...' });

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          subject: subject.trim() || 'Support request',
          message: message.trim()
        })
      });

      const body = await response.text();
      if (!response.ok) {
        setStatus({
          state: 'error',
          message: `Could not send message (${response.status}). ${body || 'Please try again in a moment.'}`
        });
        return;
      }

      let messageId: string | undefined;
      try {
        const parsed = JSON.parse(body) as { messageId?: string };
        messageId = parsed.messageId;
      } catch {
        // Keep response plain-text fallback available without parse.
      }

      setStatus({
        state: 'success',
        message: 'Thanks for reaching out. Support received your message.',
        messageId
      });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Network request failed. Please try again in a moment.'
      });
    }
  }

  function reset() {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setStatus({ state: 'idle', message: initialStatus });
  }

  return (
    <PageShell>
      <Eyebrow>Contact</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Support and feedback</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView support receives only the details you submit here. We route every message to the configured support inbox using Resend.
      </p>

      <Card className="mt-6 border-emerald-200">
        <form className="mt-3 grid gap-3" onSubmit={submit}>
          <label className="block text-sm font-black text-slate-700" htmlFor="feedback-name">Name (optional)</label>
          <input
            id="feedback-name"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            disabled={status.state === 'sending'}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            type="text"
            value={name}
          />

          <label className="mt-1 block text-sm font-black text-slate-700" htmlFor="feedback-email">Email</label>
          <input
            id="feedback-email"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            disabled={status.state === 'sending'}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />

          <label className="mt-1 block text-sm font-black text-slate-700" htmlFor="feedback-subject">Subject</label>
          <input
            id="feedback-subject"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            disabled={status.state === 'sending'}
            maxLength={140}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Short summary"
            type="text"
            value={subject}
          />

          <label className="mt-1 block text-sm font-black text-slate-700" htmlFor="feedback-message">Message</label>
          <textarea
            id="feedback-message"
            className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            disabled={status.state === 'sending'}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe the issue or share your suggestion."
            required
            rows={8}
            value={message}
          />
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status.state === 'sending' || !email.trim() || !message.trim()}
              type="submit"
            >
              {status.state === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <button
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-black text-slate-800"
              disabled={status.state === 'sending'}
              onClick={reset}
              type="button"
            >
              Reset draft
            </button>
          </div>
          <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-800" data-feedback-state={status.state}>
            {status.message}
            {status.messageId ? ` Reference: ${status.messageId}` : null}
          </p>
        </form>
      </Card>
    </PageShell>
  );
}
