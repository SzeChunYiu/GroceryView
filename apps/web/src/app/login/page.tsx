import Link from "next/link";
import { KeyRound, ShieldCheck, Smartphone } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Sign in</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Access your GroceryView workspace</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
          Continue to price alerts, household budgets, scanner review queues, and privacy controls with a protected account session.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <TrustItem icon={KeyRound} label="Passwordless" detail="Email magic link" />
          <TrustItem icon={Smartphone} label="Device aware" detail="Mobile scanner ready" />
          <TrustItem icon={ShieldCheck} label="Private" detail="Receipt media separated" />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <form className="grid gap-5">
          <div>
            <label className="text-sm font-semibold text-zinc-800" htmlFor="email">
              Email
            </label>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 text-base text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-zinc-800" htmlFor="workspace">
              Workspace
            </label>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="workspace"
              name="workspace"
            >
              <option>Household workspace</option>
              <option>Solo price watch</option>
              <option>Reviewer desk</option>
            </select>
          </div>
          <button className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800" type="button">
            Send sign-in link
          </button>
        </form>
        <div className="mt-6 rounded-lg bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-950">Demo access</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">Use the app navigation to inspect account, household, privacy, basket, and scanner surfaces without a live auth provider.</p>
          <Link className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900" href="/account">
            Open account workspace
          </Link>
        </div>
      </section>
    </main>
  );
}

function TrustItem({ icon: Icon, label, detail }: { icon: typeof KeyRound; label: string; detail: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      <p className="mt-3 font-semibold text-zinc-950">{label}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </article>
  );
}
