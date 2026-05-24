"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";

type FeedbackFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const feedbackBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const feedbackEndpoint = `${feedbackBase}/feedback`;

export default function FeedbackPage() {
  const [formState, setFormState] = useState<FeedbackFormState>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(
    () => formState.name.trim() && formState.email.trim() && formState.message.trim() && status !== "sending",
    [formState, status]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch(feedbackEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formState.name.trim(),
          email: formState.email.trim(),
          subject: formState.subject.trim() || undefined,
          message: formState.message.trim()
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to send feedback. Please try again.");
      }

      setFormState({ name: "", email: "", subject: "", message: "" });
      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not send feedback.");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Support</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Contact support</h1>
        <p className="text-sm text-zinc-600">
          Have a suggestion, bug report, or question? Send us a message and our team will review it.
        </p>
      </section>

      <form
        className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        onSubmit={onSubmit}
        aria-describedby={errorMessage ? "feedback-error" : undefined}
      >
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-zinc-700">Your name</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            required
            maxLength={120}
            value={formState.name}
            onChange={(event) => setFormState({ ...formState, name: event.target.value })}
            placeholder="Your full name"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-zinc-700">Email</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            required
            type="email"
            maxLength={255}
            value={formState.email}
            onChange={(event) => setFormState({ ...formState, email: event.target.value })}
            placeholder="you@example.com"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-zinc-700">Subject (optional)</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            maxLength={140}
            value={formState.subject}
            onChange={(event) => setFormState({ ...formState, subject: event.target.value })}
            placeholder="Feature request, bug report, etc."
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-zinc-700">Message</span>
          <textarea
            className="min-h-44 resize-y rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            required
            maxLength={5000}
            value={formState.message}
            onChange={(event) => setFormState({ ...formState, message: event.target.value })}
            placeholder="What can we improve?"
          />
        </label>

        <button
          disabled={!canSubmit}
          type="submit"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {status === "sending" ? "Sending..." : "Send feedback"}
        </button>

        {errorMessage ? (
          <p id="feedback-error" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {status === "success" ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Thanks for your feedback — we received your message.
          </p>
        ) : null}
      </form>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-700">Need quicker support?</p>
        <p className="mt-1">If this is a time-sensitive issue, include your full store or product context and timestamp in the message.</p>
        <p className="mt-2 inline-flex items-center gap-2 text-zinc-700">
          <Mail className="h-4 w-4" aria-hidden="true" />
          <span>We typically respond during Stockholm business hours.</span>
        </p>
      </section>
    </main>
  );
}
