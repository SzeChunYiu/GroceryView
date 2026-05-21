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

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
              <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Household profile</p>
              <h2 className="text-2xl font-semibold text-zinc-950">{accountProfile.shopperName}</h2>
            </div>
          </div>
          <div className="mt-5 divide-y divide-zinc-200">
            <ProfileRow label="Home district" value={accountProfile.homeDistrict} />
            <ProfileRow label="Preferred store" value={accountProfile.preferredStore} />
            <ProfileRow label="Weekly budget" value={accountProfile.weeklyBudget} />
            <ProfileRow label="Profile completeness" value={accountProfile.profileCompleteness} />
          </div>
        </article>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Receipt queue</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-950">Review savings before household totals update</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Receipt</th>
                  <th className="px-5 py-3">Store</th>
                  <th className="px-5 py-3">Impact</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {receiptReviewQueue.map((receipt) => (
                  <tr key={`${receipt.receipt}-${receipt.store}`} className="align-top">
                    <td className="px-5 py-4 font-semibold text-zinc-950">
                      <Link className="underline decoration-zinc-300 underline-offset-4 hover:text-emerald-700" href={receipt.href}>
                        {receipt.receipt}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">{receipt.store}</td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-emerald-700">{receipt.impact}</td>
                    <td className="px-5 py-4 tabular-nums text-zinc-700">{receipt.confidence}</td>
                    <td className="px-5 py-4 text-zinc-600">{receipt.issue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Panel title="Approval rule" value="Review over 400 kr" detail="Large receipts need owner approval before household totals update." />
        <Panel title="Substitution guard" value="Diet first" detail="Smart swaps must satisfy member restrictions before price ranking." />
        <Panel title="Export scope" value="Totals only" detail="Shared exports omit payment methods, precise locations, and raw images." />
      </section>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-950">{value}</span>
    </div>
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
