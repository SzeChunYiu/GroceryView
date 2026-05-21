import Link from "next/link";
import { AlertTriangle, ReceiptText, ShieldCheck, Store, Users } from "lucide-react";
import { householdMembers } from "@/components/sample-data";
import { accountProfile, receiptReviewQueue } from "@/lib/demo-data";

const householdStats = [
  { label: "Monthly budget", value: "6 800 kr", detail: "Shared grocery target", icon: ReceiptText },
  { label: "Active members", value: String(householdMembers.length), detail: "2 shoppers, 1 reviewer", icon: Users },
  { label: "Diet alerts", value: "2", detail: "Nut and pork checks", icon: AlertTriangle },
  { label: "Sharing policy", value: "Limited", detail: "Line totals only", icon: ShieldCheck },
];

export default function HouseholdPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Household</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Shared grocery controls</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Coordinate budgets, dietary rules, and review duties without exposing payment details or private receipt images.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {householdStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" key={stat.label}>
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                  <p className="text-2xl font-semibold tabular-nums text-zinc-950">{stat.value}</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-950">{stat.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{stat.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[0.9fr_0.7fr_0.6fr_1fr]">
          <span>Member</span>
          <span>Role</span>
          <span>Budget</span>
          <span>Dietary rules</span>
        </div>
        {householdMembers.map((member) => (
          <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[0.9fr_0.7fr_0.6fr_1fr]" key={member.name}>
            <p className="font-semibold text-zinc-950">{member.name}</p>
            <p className="text-zinc-700">{member.role}</p>
            <p className="font-semibold tabular-nums text-zinc-950">{member.budgetShare}%</p>
            <p className="text-zinc-600">{member.dietaryTags}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Panel title="Approval rule" value="Review over 400 kr" detail="Large receipts need owner approval before household totals update." />
        <Panel title="Substitution guard" value="Diet first" detail="Smart swaps must satisfy member restrictions before price ranking." />
        <Panel title="Export scope" value="Totals only" detail="Shared exports omit payment methods, precise locations, and raw images." />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <Store className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Household profile</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{accountProfile.shopperName}</h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <ProfileRow label="Home district" value={accountProfile.homeDistrict} />
            <ProfileRow label="Default store" value={accountProfile.preferredStore} />
            <ProfileRow label="Weekly budget" value={accountProfile.weeklyBudget} />
            <ProfileRow label="Profile complete" value={accountProfile.profileCompleteness} />
          </dl>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_0.7fr_0.55fr_0.5fr]">
            <span>Receipt queue</span>
            <span>Store</span>
            <span>Impact</span>
            <span>Confidence</span>
          </div>
          {receiptReviewQueue.map((receipt) => (
            <Link
              className="grid gap-3 border-b border-zinc-200 px-5 py-4 text-sm transition last:border-b-0 hover:bg-emerald-50/40 md:grid-cols-[1fr_0.7fr_0.55fr_0.5fr]"
              href={receipt.href}
              key={receipt.receipt}
            >
              <span>
                <span className="block font-semibold text-zinc-950">{receipt.receipt}</span>
                <span className="mt-1 block text-zinc-500">{receipt.issue}</span>
              </span>
              <span className="text-zinc-700">{receipt.store}</span>
              <span className="font-semibold tabular-nums text-zinc-950">{receipt.impact}</span>
              <span className="font-semibold tabular-nums text-zinc-700">{receipt.confidence}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Panel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </article>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}
