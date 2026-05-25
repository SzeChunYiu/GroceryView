'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { Toast, ToastRegion, type ToastVariant } from './toast';

type ContactFields = {
  email: string;
  message: string;
  name: string;
};

type ContactErrors = Partial<Record<keyof ContactFields, string>>;

type SubmitState = {
  description: string;
  title: string;
  variant: ToastVariant;
};

const initialFields: ContactFields = {
  email: '',
  message: '',
  name: ''
};

function validate(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  if (fields.name.trim().length < 2) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = 'Enter a valid email address.';
  if (fields.message.trim().length < 10) errors.message = 'Enter at least 10 characters.';
  return errors;
}

export function ContactForm() {
  const [fields, setFields] = useState<ContactFields>(initialFields);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<SubmitState | null>(null);
  const errorCount = Object.keys(errors).length;
  const fieldClassName = 'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

  const submitLabel = useMemo(() => (isSubmitting ? 'Sending' : 'Send message'), [isSubmitting]);

  function updateField(field: keyof ContactFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setToast({
        description: 'Review the highlighted fields and send again.',
        title: 'Message not sent',
        variant: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setToast(null);
    try {
      const response = await fetch('/api/contact', {
        body: JSON.stringify({
          email: fields.email.trim(),
          message: fields.message.trim(),
          name: fields.name.trim()
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'Contact request failed.');

      setFields(initialFields);
      setErrors({});
      setToast({
        description: 'GroceryView received your message and contact details.',
        title: 'Message sent',
        variant: 'success'
      });
    } catch (error) {
      setToast({
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        title: 'Message failed',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        {errorCount > 0 ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-950" role="alert">
            {errorCount} field{errorCount === 1 ? '' : 's'} need attention.
          </p>
        ) : null}

        <div>
          <label className="text-sm font-black text-slate-950" htmlFor="contact-name">Name</label>
          <input
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            className={fieldClassName}
            id="contact-name"
            name="name"
            onChange={(event) => updateField('name', event.target.value)}
            value={fields.name}
          />
          {errors.name ? <p className="mt-2 text-sm font-bold text-rose-700" id="contact-name-error" role="alert">{errors.name}</p> : null}
        </div>

        <div>
          <label className="text-sm font-black text-slate-950" htmlFor="contact-email">Email</label>
          <input
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={fieldClassName}
            id="contact-email"
            inputMode="email"
            name="email"
            onChange={(event) => updateField('email', event.target.value)}
            type="email"
            value={fields.email}
          />
          {errors.email ? <p className="mt-2 text-sm font-bold text-rose-700" id="contact-email-error" role="alert">{errors.email}</p> : null}
        </div>

        <div>
          <label className="text-sm font-black text-slate-950" htmlFor="contact-message">Message</label>
          <textarea
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            aria-invalid={Boolean(errors.message)}
            className={`${fieldClassName} min-h-36 resize-y`}
            id="contact-message"
            name="message"
            onChange={(event) => updateField('message', event.target.value)}
            value={fields.message}
          />
          {errors.message ? <p className="mt-2 text-sm font-bold text-rose-700" id="contact-message-error" role="alert">{errors.message}</p> : null}
        </div>

        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSubmitting}
          type="submit"
        >
          <Send aria-hidden="true" size={18} />
          {submitLabel}
        </button>
      </form>

      {toast ? (
        <ToastRegion label="Contact notifications">
          <Toast description={toast.description} onClose={() => setToast(null)} title={toast.title} variant={toast.variant} />
        </ToastRegion>
      ) : null}
    </>
  );
}
