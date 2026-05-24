'use client';

import { FormEvent, useState } from 'react';

type ContactStatus = 'idle' | 'submitting' | 'success' | 'error';

const initialMessage = 'Send a message to the GroceryView team. Required fields stay in your browser until submitted.';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [toast, setToast] = useState(initialMessage);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatus('error');
      setToast('Name, email, and message are required before sending.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatus('error');
      setToast('Enter a valid email address before sending.');
      return;
    }

    setStatus('submitting');
    setToast('Sending contact request...');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, message: trimmedMessage })
      });

      if (!response.ok) throw new Error('contact_request_failed');

      setStatus('success');
      setToast('Message received. The local contact stub recorded your request.');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
      setToast('Contact request failed. Try again after the contact API is reachable.');
    }
  }

  return (
    <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm" aria-label="Contact form">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Contact</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Send a message</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        Use this form for product coverage questions, source corrections, and account support. The current stub records submissions locally until a production inbox is connected.
      </p>

      <form className="mt-5 grid gap-4" onSubmit={submitContact}>
        <label className="text-sm font-black text-slate-950" htmlFor="contact-name">
          Name
          <input
            autoComplete="name"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            id="contact-name"
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            type="text"
            value={name}
          />
        </label>

        <label className="text-sm font-black text-slate-950" htmlFor="contact-email">
          Email
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            id="contact-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="text-sm font-black text-slate-950" htmlFor="contact-message">
          Message
          <textarea
            className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            id="contact-message"
            minLength={10}
            onChange={(event) => setMessage(event.target.value)}
            required
            value={message}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-full bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === 'submitting'}
            type="submit"
          >
            {status === 'submitting' ? 'Sending...' : 'Send message'}
          </button>
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950" data-status={status} role={status === 'error' ? 'alert' : 'status'}>
            {toast}
          </p>
        </div>
      </form>
    </section>
  );
}
