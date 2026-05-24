export default function AdminUsersPage() {
  const users = [
    {
      email: 'r.svensson@example.se',
      registeredAt: '2026-01-18',
      activeAlerts: 3,
      status: 'Active',
    },
    {
      email: 'u.nordstrom@example.se',
      registeredAt: '2025-11-09',
      activeAlerts: 1,
      status: 'Disabled',
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Admin</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">User management</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-600">
          Admin-only operations are shown in fail-closed preview mode until an authenticated API session is configured.
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm" data-groceryview-flow="admin-users">
        <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.9fr_0.9fr]">
          <span>Email</span>
          <span>Registered</span>
          <span>Active alerts</span>
          <span>Status</span>
          <span>Disable action</span>
          <span>Resend verification</span>
        </div>
        {users.map((user) => (
          <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 text-sm last:border-b-0 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.9fr_0.9fr]" key={user.email}>
            <p className="font-semibold text-zinc-950">{user.email}</p>
            <p className="text-zinc-700">{user.registeredAt}</p>
            <p className="font-semibold text-zinc-950">{user.activeAlerts}</p>
            <p className="text-zinc-700">{user.status}</p>
            <button className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100" type="button" data-flow-action="admin-disable-user">
              Disable user
            </button>
            <button className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100" type="button" data-flow-action="admin-resend-verification">
              Resend verification
            </button>
          </article>
        ))}
      </section>
      <p className="text-xs text-zinc-500" data-flow-result="admin-users">
        API unavailable: connect the API session bridge before loading admin users.
      </p>
    </main>
  );
}
