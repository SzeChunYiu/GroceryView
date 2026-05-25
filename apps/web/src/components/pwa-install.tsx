'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Platform = 'android' | 'desktop' | 'ios';

const dismissedKey = 'groceryview:pwa-install-dismissed';

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

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    setPlatform(getPlatform(window.navigator.userAgent));
    setStandalone(isStandalone());
    setDismissed(window.localStorage.getItem(dismissedKey) === 'true');

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
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (standalone || dismissed) return null;

  const canInstall = deferredPrompt !== null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'dismissed') {
      window.localStorage.setItem(dismissedKey, 'true');
    }
    setDismissed(true);
  }

  function handleDismiss() {
    window.localStorage.setItem(dismissedKey, 'true');
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
