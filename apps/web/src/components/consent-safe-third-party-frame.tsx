'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { thirdPartyInventoryById, type ThirdPartyConsentCategory } from '@/lib/third-party-loading';

type ConsentSnapshot = {
  policyVersion?: string;
  categories?: Partial<Record<'necessary' | 'analytics' | 'ads' | 'personalisation', boolean>>;
};

type ConsentSafeThirdPartyFrameProps = {
  allowFullScreen?: boolean;
  className?: string;
  consentCategory: ThirdPartyConsentCategory;
  src: string;
  title: string;
  vendorId: string;
};

const CONSENT_POLICY_VERSION = '2026-05-22-consent-v1';
const CONSENT_STORAGE_KEY = 'groceryview:consent:state';

function storedConsentCategoryGranted(category: ThirdPartyConsentCategory) {
  if (typeof window === 'undefined') return false;
  const runtimeConsent = (window as Window & { groceryviewConsent?: ConsentSnapshot }).groceryviewConsent;
  if (runtimeConsent?.policyVersion === CONSENT_POLICY_VERSION) return runtimeConsent.categories?.[category] === true;

  try {
    const stored = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) || 'null') as ConsentSnapshot | null;
    return stored?.policyVersion === CONSENT_POLICY_VERSION && stored.categories?.[category] === true;
  } catch {
    return false;
  }
}

export function ConsentSafeThirdPartyFrame({
  allowFullScreen = false,
  className,
  consentCategory,
  src,
  title,
  vendorId
}: Readonly<ConsentSafeThirdPartyFrameProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const inventoryEntry = useMemo(() => thirdPartyInventoryById(vendorId), [vendorId]);
  const canLoadFrame = hasConsent && hasInteraction && isVisible;

  useEffect(() => {
    function refreshConsent() {
      setHasConsent(storedConsentCategoryGranted(consentCategory));
    }

    refreshConsent();
    window.addEventListener('groceryview:consent-updated', refreshConsent);
    window.addEventListener('storage', refreshConsent);
    return () => {
      window.removeEventListener('groceryview:consent-updated', refreshConsent);
      window.removeEventListener('storage', refreshConsent);
    };
  }, [consentCategory]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '160px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (canLoadFrame) {
    return (
      <iframe
        allowFullScreen={allowFullScreen}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={src}
        title={title}
      />
    );
  }

  return (
    <div
      className={`flex min-h-80 flex-col items-center justify-center gap-3 bg-slate-100 p-4 text-center ${className ?? ''}`}
      data-third-party-consent={consentCategory}
      data-third-party-id={vendorId}
      data-third-party-trigger={inventoryEntry?.loadTrigger ?? 'consent+interaction+visibility'}
      ref={containerRef}
    >
      <p className="max-w-sm text-sm font-bold text-slate-700">
        {hasConsent ? 'Map preview is ready.' : 'Map preview is blocked until personalisation consent is granted.'}
      </p>
      <button
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!hasConsent}
        onClick={() => setHasInteraction(true)}
        type="button"
      >
        Load map
      </button>
    </div>
  );
}
