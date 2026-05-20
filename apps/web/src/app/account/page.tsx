import Link from "next/link";
import { Bell, CheckCircle2, Clock, Mail, Smartphone } from "lucide-react";
import { basketItems, formatSek } from "@/components/sample-data";

const alertRules = [
  { label: "Coffee drops below median", channel: "Push", threshold: "Under 52 kr", status: "Active" },
  { label: "Butter rises above usual", channel: "Email", threshold: "Over 55 kr", status: "Active" },
  { label: "Receipt needs review", channel: "Push", threshold: "Low confidence", status: "Paused" },
];

const subscriptionAccess = {
  tier: "Premium",
  summary: "Premium access is active.",
  source: "/api/account/subscription-access",
  action: "Manage subscription",
  details: ["Ads removed", "Checkout prompts hidden", "Billing portal ready"],
};

export default function AccountPage() {
  const watchTotal = basketItems.slice(0, 3).reduce((sum, item) => sum + item.currentPrice, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Account</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Watchlists and alert rules</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Tune the account-level signals that drive price alerts, receipt review reminders, and weekly basket notifications.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={Bell} label="Rules" value={String(alertRules.length)} />
          <Metric icon={Smartphone} label="Push" value="2" />
          <Metric icon={Mail} label="Email" value="1" />
        </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Subscription access</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950">{subscriptionAccess.summary}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-900">
              Loaded from <code className="rounded bg-white/70 px-1 py-0.5 text-emerald-950">{subscriptionAccess.source}</code> so account UI can
              enforce premium features without exposing provider billing identifiers.
            </p>
          </div>
          <Link className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800" href="/account">
            {subscriptionAccess.action}
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {subscriptionAccess.details.map((detail) => (
            <div className="rounded-lg bg-white/80 p-3 text-sm font-semibold text-emerald-950" key={detail}>
              <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-700" aria-hidden="true" />
              {detail}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Watchlist value</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-950">{formatSek(watchTotal)}</p>
          <p className="mt-2 text-sm text-zinc-500">Current price across tracked staples</p>
          <div className="mt-5 grid gap-3">
            {basketItems.slice(0, 3).map((item) => (
              <Link className="rounded-lg bg-zinc-50 p-3 transition hover:bg-zinc-100" href={`/products/${item.name.toLowerCase().replaceAll(" ", "-")}`} key={item.name}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-zinc-950">{item.name}</span>
                  <span className="tabular-nums text-zinc-700">{formatSek(item.currentPrice)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_0.45fr_0.55fr_0.45fr]">
            <span>Rule</span>
            <span>Channel</span>
            <span>Threshold</span>
            <span>Status</span>
          </div>
          {alertRules.map((rule) => (
            <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_0.45fr_0.55fr_0.45fr]" key={rule.label}>
              <p className="font-semibold text-zinc-950">{rule.label}</p>
              <p className="text-zinc-700">{rule.channel}</p>
              <p className="text-zinc-700">{rule.threshold}</p>
              <span className={`inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold ${rule.status === "Active" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
                {rule.status === "Active" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Clock className="h-4 w-4" aria-hidden="true" />}
                {rule.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      <p className="mt-3 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{value}</p>
    </article>
  );
}
