'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type AdminUser = {
  id: string;
  email: string | null;
  registeredAt: string | null;
  disabledAt: string | null;
  verificationSentAt: string | null;
  activeAlertCount: number;
  status: 'active' | 'disabled';
};

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

const fallbackUsers: AdminUser[] = [
  {
    id: 'demo-admin-user',
    email: 'demo@example.com',
    registeredAt: '2026-05-20T12:00:00.000Z',
    disabledAt: null,
    verificationSentAt: null,
    activeAlertCount: 3,
    status: 'active'
  }
];

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(fallbackUsers);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [message, setMessage] = useState('Admin user management loads live rows from the API when it is available.');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL ?? '', []);

  async function loadUsers() {
    setStatus('loading');
    try {
      const response = await fetch(`${apiBase}/admin/users?limit=50`, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error('Admin users request failed.');
      const payload = await response.json() as { users: AdminUser[] };
      setUsers(payload.users);
      setStatus('ready');
      setMessage(`Loaded ${payload.users.length} account rows from the admin API.`);
    } catch {
      setStatus('error');
      setMessage('Admin API is unavailable, so the page is showing the static fail-closed preview row.');
      setUsers(fallbackUsers);
    }
  }

  async function runAction(userId: string, action: 'disable' | 'resend-verification') {
    setPendingUserId(userId);
    try {
      const response = await fetch(`${apiBase}/admin/users/${encodeURIComponent(userId)}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error('Admin action failed.');
      const payload = await response.json() as { user: AdminUser };
      setUsers((current) => current.map((user) => (user.id === userId ? payload.user : user)));
      setStatus('ready');
      setMessage(action === 'disable' ? `Disabled ${payload.user.email ?? payload.user.id}.` : `Queued verification resend for ${payload.user.email ?? payload.user.id}.`);
    } catch {
      setStatus('error');
      setMessage('Admin action was rejected by the API. No local-only account mutation was applied.');
    } finally {
      setPendingUserId(null);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <PageShell>
      <Eyebrow>Admin</Eyebrow>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">User management</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Review account registrations, alert activity, verification resend state, and disabled accounts from the admin API.
          </p>
        </div>
        <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={loadUsers} type="button">
          Refresh users
        </button>
      </div>

      <p className="mt-6 rounded-2xl bg-white p-4 text-sm font-bold text-slate-800" data-status={status}>{message}</p>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
              <tr>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Registered</th>
                <th className="px-5 py-4">Active alerts</th>
                <th className="px-5 py-4">Verification</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950">{user.email ?? 'No email'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{user.id}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{formatDate(user.registeredAt)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-black text-emerald-800">{user.activeAlertCount}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{formatDate(user.verificationSentAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 font-black ${user.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-rose-300 px-3 py-2 text-xs font-black text-rose-800 disabled:opacity-50"
                        disabled={user.status === 'disabled' || pendingUserId === user.id}
                        onClick={() => void runAction(user.id, 'disable')}
                        type="button"
                      >
                        Disable
                      </button>
                      <button
                        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-black text-slate-800 disabled:opacity-50"
                        disabled={pendingUserId === user.id}
                        onClick={() => void runAction(user.id, 'resend-verification')}
                        type="button"
                      >
                        Resend verification
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
