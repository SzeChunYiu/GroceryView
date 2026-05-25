'use client';

import { useState } from 'react';
import { enableMyFlyerReadyPush, refreshMyFlyerAndNotify, type MyFlyerReadyNotification } from '@/lib/push';

type MyFlyerPushActionsProps = MyFlyerReadyNotification & {
  accountId: string;
  country: string;
  vapidPublicKey: string;
};

type PushStatus = 'idle' | 'saving' | 'ready' | 'refreshing' | 'blocked' | 'error';

export function MyFlyerPushActions({
  accountId,
  country,
  dealCount,
  generatedAt,
  saveUpToKr,
  url,
  vapidPublicKey
}: MyFlyerPushActionsProps) {
  const [status, setStatus] = useState<PushStatus>('idle');
  const [message, setMessage] = useState('Notify me when this weekly flyer regenerates.');

  async function optIn() {
    setStatus('saving');
    try {
      const result = await enableMyFlyerReadyPush({ accountId, vapidPublicKey });
      if (!result.enabled) {
        setStatus('blocked');
        setMessage('Notifications are not enabled in this browser.');
        return;
      }

      setStatus('refreshing');
      const refresh = await refreshMyFlyerAndNotify({
        userId: accountId,
        country,
        limit: dealCount,
        url
      }, { dealCount, generatedAt, saveUpToKr, url });
      setStatus('ready');
      setMessage(refresh.cacheStatus === 'MISS'
        ? 'MyFlyer regenerated and the ready notification was sent.'
        : 'MyFlyer notifications are enabled. The next regeneration will send a ready alert.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to enable MyFlyer notifications.');
    }
  }

  return (
    <div className="my-flyer-screen-only flex flex-col gap-2 rounded-3xl border border-orange-200 bg-white p-4 text-sm font-bold text-slate-700 sm:flex-row sm:items-center sm:justify-between" data-print-hide>
      <p data-my-flyer-push-status={status}>{message}</p>
      <button
        className="rounded-full bg-orange-700 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={status === 'saving' || status === 'refreshing'}
        onClick={optIn}
        type="button"
      >
        Enable alert
      </button>
    </div>
  );
}
