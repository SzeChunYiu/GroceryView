'use client';

import { FormEvent, useEffect, useState } from 'react';

type ProfileStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'saving' | 'saved' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type ProfilePayload = {
  userId: string;
  email: string | null;
  displayName: string | null;
  accountCreatedAt: string | null;
};

function readSession(): BrowserSession {
  if (typeof window === 'undefined') return { accessToken: '', userId: '' };
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

function formatAccountDate(value: string | null): string {
  if (!value) return 'Creation date is available after your authenticated profile is loaded.';
  return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export default function ProfilePage() {
  const [status, setStatus] = useState<ProfileStatus>('idle');
  const [message, setMessage] = useState('Sign in to load your profile.');
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous profile reads or account changes are sent.');
      return null;
    }
    return session;
  }

  async function loadProfile() {
    const session = requireSession();
    if (!session) return;
    setStatus('loading');
    const response = await fetch('/api/settings/profile', {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Profile was rejected by the authenticated settings API.');
      return;
    }
    const payload = await response.json() as ProfilePayload;
    setProfile(payload);
    setDisplayName(payload.displayName ?? '');
    setStatus('ready');
    setMessage('Authenticated profile loaded.');
  }

  async function saveDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    setStatus('saving');
    const response = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ displayName })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Display name update was rejected.');
      return;
    }
    const payload = await response.json() as ProfilePayload;
    setProfile(payload);
    setDisplayName(payload.displayName ?? '');
    setStatus('saved');
    setMessage('Display name saved for your account.');
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    setStatus('saving');
    const response = await fetch('/api/settings/profile/password', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Password change was rejected. Use at least 12 characters and a new value.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setStatus('saved');
    setMessage('Password change accepted by the authenticated settings API.');
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" aria-label="Profile overview">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Account profile</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Profile</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Manage the display name shown on account surfaces, rotate your password, and confirm when the account was created.
              </p>
            </div>
            <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800" onClick={loadProfile} type="button">
              Refresh
            </button>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-100 p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">User ID</dt>
              <dd className="mt-2 break-words text-sm font-black">{profile?.userId ?? readSession().userId || 'Not signed in'}</dd>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Email</dt>
              <dd className="mt-2 break-words text-sm font-black">{profile?.email ?? 'Not available'}</dd>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Created</dt>
              <dd className="mt-2 text-sm font-black">{formatAccountDate(profile?.accountCreatedAt ?? null)}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-950" data-status={status}>{message}</p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={saveDisplayName}>
            <h2 className="text-xl font-black tracking-tight">Display name</h2>
            <label className="mt-4 block text-sm font-bold text-slate-800" htmlFor="display-name">Name</label>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
              id="display-name"
              maxLength={80}
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
            <button className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" disabled={!displayName.trim()} type="submit">
              Save display name
            </button>
          </form>

          <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={changePassword}>
            <h2 className="text-xl font-black tracking-tight">Password</h2>
            <label className="mt-4 block text-sm font-bold text-slate-800" htmlFor="current-password">Current password</label>
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
              id="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              value={currentPassword}
            />
            <label className="mt-4 block text-sm font-bold text-slate-800" htmlFor="new-password">New password</label>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
              id="new-password"
              minLength={12}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
            <button className="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-black text-white" disabled={!currentPassword || newPassword.length < 12} type="submit">
              Change password
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
