'use client';

import { useEffect, useRef, useState } from 'react';
import { trackPwaInstallAnalytics } from '@/lib/analytics';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Platform = 'android' | 'desktop' | 'ios';

const dismissedKey = 'groceryview:pwa-install-dismissed';
const educationDismissedKey = 'groceryview:pwa-install-education-dismissed';

function getPlatform(userAgent: string): Platform {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return 'desktop';
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function stepsFor(platform: Platform, canInstall: boolean) {
  if (canInstall) return 'Install GroceryView for one-tap access, offline list check-off, and cached product details.';
  if (platform === 'ios') return 'On iPhone or iPad: tap Share, then Add to Home Screen.';
  if (platform === 'android') return 'On Android: open the browser menu, then tap Install app or Add to Home screen.';
  return 'On desktop: use your browser install button or menu to add GroceryView as an app.';
}

export function PwaInstallEducationCard() {
  const [dismissed, setDismissed] = useState(true);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    setPlatform(getPlatform(window.navigator.userAgent));
    setStandalone(isStandalone());
    setDismissed(window.localStorage.getItem(educationDismissedKey) === 'true');
    setReady(true);
  }, []);

  function dismissEducation() {
    window.localStorage.setItem(educationDismissedKey, 'true');
    setDismissed(true);
  }

  if (!ready || standalone || dismissed) return null;

  return (
    <aside className="mx-auto my-6 max-w-5xl rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm" aria-label="Home screen install education">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Install GroceryView</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Add GroceryView to your home screen</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{stepsFor(platform, false)}</p>
        </div>
        <button
          className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-900 hover:border-emerald-400"
          onClick={dismissEducation}
          type="button"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-4 grid gap-3 text-sm font-bold text-emerald-950 sm:grid-cols-3">
        <li className="rounded-2xl bg-white p-3">One-tap access before weekly shopping runs.</li>
        <li className="rounded-2xl bg-white p-3">Offline shopping-list check-off while in store aisles.</li>
        <li className="rounded-2xl bg-white p-3">Cached product and store details when reception is weak.</li>
      </ul>
    </aside>
  );
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const impressionKeyRef = useRef<string | null>(null);
  const standaloneLaunchTrackedRef = useRef(false);

  const canInstall = deferredPrompt !== null;

  useEffect(() => {
    setPlatform(getPlatform(window.navigator.userAgent));
    setStandalone(isStandalone());
    setDismissed(window.localStorage.getItem(dismissedKey) === 'true');
    setReady(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (window.localStorage.getItem(dismissedKey) === 'true') return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setStandalone(true);
      window.localStorage.setItem(dismissedKey, 'true');
      trackPwaInstallAnalytics({
        action: 'app_installed',
        canInstall: false,
        platform: getPlatform(window.navigator.userAgent),
        source: 'appinstalled'
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (standalone) {
      if (standaloneLaunchTrackedRef.current) return;
      standaloneLaunchTrackedRef.current = true;
      trackPwaInstallAnalytics({
        action: 'standalone_launch',
        canInstall,
        launchSource: new URLSearchParams(window.location.search).get('utm_source') ?? undefined,
        platform,
        source: 'standalone_display'
      });
      return;
    }

    if (dismissed) return;

    const impressionKey = `${platform}:${canInstall ? 'installable' : 'instructions'}`;
    if (impressionKeyRef.current === impressionKey) return;
    impressionKeyRef.current = impressionKey;
    trackPwaInstallAnalytics({
      action: 'prompt_impression',
      canInstall,
      platform,
      source: canInstall ? 'beforeinstallprompt' : 'install_banner'
    });
  }, [canInstall, dismissed, platform, ready, standalone]);

  if (standalone || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'dismissed') {
      window.localStorage.setItem(dismissedKey, 'true');
    }
    trackPwaInstallAnalytics({
      action: choice.outcome === 'accepted' ? 'install_prompt_accepted' : 'install_prompt_dismissed',
      canInstall: true,
      platform,
      source: 'beforeinstallprompt'
    });
    setDismissed(true);
  }

  function handleDismiss() {
    window.localStorage.setItem(dismissedKey, 'true');
    trackPwaInstallAnalytics({
      action: 'banner_dismissed',
      canInstall,
      platform,
      source: 'install_banner'
    });
    setDismissed(true);
  }

  return (
    <aside
      aria-label="Install GroceryView"
      style={{
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid rgba(15, 23, 42, 0.12)',
        borderRadius: '16px',
        bottom: '16px',
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
        color: '#0f172a',
        left: '16px',
        margin: '0 auto',
        maxWidth: '640px',
        padding: '16px',
        position: 'fixed',
        right: '16px',
        zIndex: 50
      }}
    >
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ display: 'block', fontSize: '0.95rem' }}>Add GroceryView for offline shopping</strong>
          <span style={{ display: 'block', fontSize: '0.875rem', lineHeight: 1.45, marginTop: '4px' }}>
            {stepsFor(platform, canInstall)}
          </span>
        </div>
        <button
          aria-label="Dismiss install banner"
          onClick={handleDismiss}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: 0,
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: 0
          }}
          type="button"
        >
          ×
        </button>
      </div>
      {canInstall ? (
        <button
          onClick={handleInstall}
          style={{
            background: '#0f766e',
            border: 0,
            borderRadius: '999px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
            marginTop: '12px',
            padding: '10px 16px'
          }}
          type="button"
        >
          Install app
        </button>
      ) : null}
    </aside>
  );
}
