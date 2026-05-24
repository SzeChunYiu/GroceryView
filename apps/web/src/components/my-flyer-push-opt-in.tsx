'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  enableFlyerPushNotifications,
  formatFlyerReadySummary,
  getFlyerPushPermissionState,
  hasFlyerPushOptIn,
  notifyFlyerReadyIfNeeded,
  type FlyerPushPermissionState
} from '@/lib/push';

type MyFlyerPushOptInProps = Readonly<{
  flyerVersion: string;
  dealCount: number;
  maxSavingsKr: number;
}>;

function statusCopy(permission: FlyerPushPermissionState, optedIn: boolean) {
  if (permission === 'unsupported') return 'PWA notifications require a secure browser with service worker support.';
  if (permission === 'denied') return 'Browser notifications are blocked. Re-enable them in site settings to receive MyFlyer alerts.';
  if (optedIn && permission === 'granted') return 'Push opt-in is on. We will notify this browser when a new weekly MyFlyer is generated.';
  return 'Opt in to get a one-line PWA push when this weekly flyer regenerates.';
}

export function MyFlyerPushOptIn({ flyerVersion, dealCount, maxSavingsKr }: MyFlyerPushOptInProps) {
  const [permission, setPermission] = useState<FlyerPushPermissionState>('unsupported');
  const [optedIn, setOptedIn] = useState(false);
  const [message, setMessage] = useState('Checking browser notification support…');
  const summary = useMemo(() => formatFlyerReadySummary({ dealCount, maxSavingsKr }), [dealCount, maxSavingsKr]);

  useEffect(() => {
    const currentPermission = getFlyerPushPermissionState();
    const currentOptIn = hasFlyerPushOptIn();
    setPermission(currentPermission);
    setOptedIn(currentOptIn);
    setMessage(statusCopy(currentPermission, currentOptIn));

    void notifyFlyerReadyIfNeeded({ flyerVersion, dealCount, maxSavingsKr });
  }, [dealCount, flyerVersion, maxSavingsKr]);

  async function optIn() {
    setMessage('Requesting notification permission…');
    const nextPermission = await enableFlyerPushNotifications();
    const nextOptIn = hasFlyerPushOptIn();
    setPermission(nextPermission);
    setOptedIn(nextOptIn);

    if (nextPermission === 'granted') {
      const sent = await notifyFlyerReadyIfNeeded({ flyerVersion, dealCount, maxSavingsKr });
      setMessage(sent ? `Opt-in saved. Test push sent: ${summary}.` : statusCopy(nextPermission, nextOptIn));
    } else {
      setMessage(statusCopy(nextPermission, nextOptIn));
    }
  }

  const disabled = permission === 'unsupported' || permission === 'denied' || optedIn;

  return (
    <section className="my-flyer-screen-only mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm" aria-label="MyFlyer push notification opt-in" data-print-hide>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">PWA flyer-ready push</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Notify me when MyFlyer regenerates</h2>
          <p className="mt-2 text-sm font-semibold text-slate-700">{summary}</p>
          <p className="mt-2 text-sm font-bold text-orange-900" data-my-flyer-push-status>{message}</p>
        </div>
        <button
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={disabled}
          onClick={optIn}
          type="button"
        >
          {optedIn ? 'Push enabled' : 'Enable push'}
        </button>
      </div>
    </section>
  );
}
