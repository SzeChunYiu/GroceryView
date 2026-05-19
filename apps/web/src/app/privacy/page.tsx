import { Database, Download, MapPin, ReceiptText, ShieldCheck } from "lucide-react";
import { privacyControls } from "@/components/sample-data";

const auditEvents = [
  { label: "Receipt image purge", detail: "3 files scheduled after review", tone: "good" },
  { label: "Location downgrade", detail: "2 observations stored at district precision", tone: "good" },
  { label: "Contribution export", detail: "Anonymous price rows ready for catalog backfill", tone: "neutral" },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Privacy</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Data sharing guardrails</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Review what is retained, shared, anonymized, and exported before household or catalog workflows use the data.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <ShieldCheck className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-emerald-800">Current posture</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">Minimal retention</p>
          <p className="mt-2 text-sm leading-6 text-emerald-900">Raw receipt media is separated from price facts and removed after review windows close.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {privacyControls.map((control) => (
          <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={control.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-950">{control.label}</p>
                <p className="mt-2 text-sm text-zinc-500">{control.detail}</p>
              </div>
              <span className="rounded-lg bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700">{control.state}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Export controls</p>
          <div className="mt-5 grid gap-3">
            <Action icon={Download} label="Download household data" detail="Receipt summaries and budget allocations" />
            <Action icon={Database} label="Catalog contribution log" detail="Anonymous price observations only" />
            <Action icon={MapPin} label="Location precision report" detail="Store district, never exact route history" />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          {auditEvents.map((event) => (
            <article className="grid gap-2 border-b border-zinc-200 px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]" key={event.label}>
              <div>
                <p className="font-semibold text-zinc-950">{event.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{event.detail}</p>
              </div>
              <span className={`h-fit rounded-lg px-3 py-1 text-sm font-semibold ${event.tone === "good" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
                {event.tone === "good" ? "Protected" : "Ready"}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Action({ icon: Icon, label, detail }: { icon: typeof ReceiptText; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3">
      <Icon className="mt-0.5 h-5 w-5 text-emerald-700" aria-hidden="true" />
      <div>
        <p className="font-semibold text-zinc-950">{label}</p>
        <p className="mt-1 text-sm text-zinc-500">{detail}</p>
      </div>
    </div>
  );
}
