import Link from 'next/link';
import { createHash } from 'node:crypto';

type SearchParams = {
  token?: string | string[];
  expires?: string | string[];
  email?: string | string[];
  requested?: string | string[];
};

const TOKENS_TTL_HINT_MINUTES = 15;

function parseExpires(raw: string | string[] | undefined): Date | null {
  if (!raw || Array.isArray(raw)) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseSearchValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function buildDemoResetUrl(email: string): { resetUrl: string; expiresAt: string } {
  const normalized = email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + TOKENS_TTL_HINT_MINUTES * 60 * 1000);
  const token = createHash('sha256').update(normalized + normalized + expiresAt.toISOString()).digest('hex').slice(0, 40);

  const resetUrl = `/reset-password?token=${encodeURIComponent(token)}&expires=${encodeURIComponent(expiresAt.toISOString())}`;
  return { resetUrl, expiresAt: expiresAt.toISOString() };
}

export default function ResetPasswordPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ?? {};
  const token = parseSearchValue(params.token);
  const expiresAt = parseExpires(params.expires);
  const requestedEmail = parseSearchValue(params.email);
  const wasRequested = parseSearchValue(params.requested);

  const tokenRequested = token.length > 0;
  const tokenExpired = tokenRequested && expiresAt ? expiresAt.getTime() <= Date.now() : false;

  const showRequestState = wasRequested && !tokenRequested && requestedEmail.length > 0;
  const demo = showRequestState
    ? buildDemoResetUrl(requestedEmail)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Back to sign in
      </Link>

      <h1 className="text-4xl font-black text-zinc-950">Reset your password</h1>

      {!tokenRequested && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Request a reset link</p>
          <p className="mt-2 text-zinc-600">
            Enter your account email and we will generate a secure time-limited password reset link.
          </p>

          {showRequestState ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">If this were live, a reset message would be sent to:</p>
              <p className="mt-1 font-mono">{requestedEmail}</p>
              <p className="mt-3">Demo link (valid until {demo!.expiresAt}):</p>
              <p className="mt-1 break-all rounded bg-white p-2 font-mono text-xs">{demo!.resetUrl}</p>
              <p className="mt-3 text-xs text-emerald-700">
                For this scaffold, open the link above to continue the flow in-browser.
              </p>
            </div>
          ) : (
            <form className="mt-5 grid gap-4" action="/reset-password" method="get">
              <input type="hidden" name="requested" value="1" />
              <label className="grid gap-2 text-sm font-semibold text-zinc-800" htmlFor="email">
                Email
                <input
                  className="h-11 rounded-lg border border-zinc-300 px-3 text-base"
                  id="email"
                  name="email"
                  required
                  type="email"
                />
              </label>
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white"
                type="submit"
              >
                Send reset link
              </button>
            </form>
          )}
        </section>
      )}

      {tokenRequested && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          {tokenExpired ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              This password reset link has expired. Request a new one below.
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Set a new password
              </p>
              <p className="mt-2 text-zinc-600">This token is valid until {expiresAt?.toLocaleString() ?? 'a limited time'}.</p>
              <form className="mt-5 grid gap-4" method="get" action="#">
                <input type="hidden" name="token" value={token} />
                <label className="grid gap-2 text-sm font-semibold text-zinc-800" htmlFor="password">
                  New password
                  <input className="h-11 rounded-lg border border-zinc-300 px-3 text-base" id="password" minLength={8} name="password" required type="password" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-zinc-800" htmlFor="confirm">
                  Confirm new password
                  <input className="h-11 rounded-lg border border-zinc-300 px-3 text-base" id="confirm" minLength={8} name="confirm" required type="password" />
                </label>
                <button className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white" type="submit">
                  Update password
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </main>
  );
}
