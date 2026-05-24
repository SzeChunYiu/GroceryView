'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Platform = 'android' | 'desktop' | 'ios';

type InstallBannerState = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  dismissed: boolean;
  platform: Platform;
  standalone: boolean;
};

const dismissedKey = 'groceryview:pwa-install-dismissed-at';
const legacyDismissedKey = 'groceryview:pwa-install-dismissed';
const dismissedCooldownMs = 7 * 24 * 60 * 60 * 1000;

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

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(dismissedKey));
  if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < dismissedCooldownMs) return true;
  if (window.localStorage.getItem(legacyDismissedKey) === 'true') {
    window.localStorage.setItem(dismissedKey, String(Date.now()));
    window.localStorage.removeItem(legacyDismissedKey);
    return true;
  }
  return false;
}

function stepsFor(platform: Platform, canInstall: boolean) {
  if (canInstall) return 'Tap Install and GroceryView opens like a native shopping app next time.';
  if (platform === 'ios') return 'On iPhone or iPad: tap Share, then Add to Home Screen.';
  if (platform === 'android') return 'On Android: open the browser menu, then tap Install app or Add to Home screen.';
  return 'On desktop: use your browser install button or menu to add GroceryView as an app.';
}

export function PwaInstall() {
  const [state, setState] = useState<InstallBannerState>({
    deferredPrompt: null,
    dismissed: true,
    platform: 'desktop',
    standalone: true
  });

  useEffect(() => {
    setState((current) => ({
      ...current,
      platform: getPlatform(window.navigator.userAgent),
      standalone: isStandalone(),
      dismissed: wasRecentlyDismissed()
    }));

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (wasRecentlyDismissed()) return;
      setState((current) => ({ ...current, deferredPrompt: event as BeforeInstallPromptEvent, dismissed: false }));
    }

    function handleAppInstalled() {
      window.localStorage.removeItem(dismissedKey);
      window.localStorage.removeItem(legacyDismissedKey);
      setState((current) => ({ ...current, deferredPrompt: null, standalone: true, dismissed: true }));
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (state.standalone || state.dismissed) return null;

  const canInstall = state.deferredPrompt !== null;

  async function handleInstall() {
    if (!state.deferredPrompt) return;
    await state.deferredPrompt.prompt();
    const choice = await state.deferredPrompt.userChoice;
    setState((current) => ({ ...current, deferredPrompt: null }));
    if (choice.outcome === 'dismissed') {
      window.localStorage.setItem(dismissedKey, String(Date.now()));
    }
    setState((current) => ({ ...current, dismissed: true }));
  }

  function handleDismiss() {
    window.localStorage.setItem(dismissedKey, String(Date.now()));
    window.localStorage.removeItem(legacyDismissedKey);
    setState((current) => ({ ...current, dismissed: true }));
  }

  return (
    <aside
      aria-label="Install GroceryView"
      style={{
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        left: '16px',
        margin: '0 auto',
        maxWidth: '680px',
        position: 'fixed',
        right: '16px',
        zIndex: 80
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(6, 78, 59, 0.16)',
          borderRadius: '24px',
          boxShadow: '0 22px 60px rgba(15, 23, 42, 0.22)',
          color: '#0f172a',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'auto 1fr auto',
          padding: '14px'
        }}
      >
        <img
          alt=""
          height="48"
          src="/pwa-maskable-icon.svg"
          style={{ borderRadius: '14px', boxShadow: '0 8px 24px rgba(6, 78, 59, 0.18)' }}
          width="48"
        />
        <div>
          <strong style={{ display: 'block', fontSize: '0.98rem' }}>Install GroceryView</strong>
          <span style={{ color: '#475569', display: 'block', fontSize: '0.875rem', lineHeight: 1.45, marginTop: '3px' }}>
            {stepsFor(state.platform, canInstall)}
          </span>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
          {canInstall ? (
            <button
              onClick={handleInstall}
              style={{
                background: '#0f766e',
                border: 0,
                borderRadius: '999px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 800,
                padding: '10px 16px',
                whiteSpace: 'nowrap'
              }}
              type="button"
            >
              Install
            </button>
          ) : null}
          <button
            aria-label="Dismiss install banner"
            onClick={handleDismiss}
            style={{
              background: '#f1f5f9',
              border: 0,
              borderRadius: '999px',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 900,
              height: '36px',
              width: '36px'
            }}
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </aside>
  );
}
