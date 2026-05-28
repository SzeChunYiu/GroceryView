'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    groceryviewConsent?: {
      policyVersion: string;
      categories: Record<'necessary' | 'analytics' | 'ads' | 'personalisation', boolean>;
    };
  }
}

type ConsentCategory = 'necessary' | 'analytics' | 'ads' | 'personalisation';
type ConsentState = Record<ConsentCategory, boolean>;

const CONSENT_POLICY_VERSION = '2026-05-22-consent-v1';
const CONSENT_STORAGE_KEY = 'groceryview:consent:state';
const CONSENT_AUDIT_KEY = 'groceryview:consent:audit';

const deniedConsentMode = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
} as const;

const categories: Array<{ key: ConsentCategory; label: string; detail: string; locked?: boolean }> = [
  { key: 'necessary', label: 'Necessary', detail: 'Required for security, consent proof, and core website navigation.', locked: true },
  { key: 'analytics', label: 'Analytics', detail: 'Optional aggregated measurement for product and source coverage improvements.' },
  { key: 'ads', label: 'Ads', detail: 'Optional ad storage. AdSense stays non-personalised until this is granted.' },
  { key: 'personalisation', label: 'Personalization', detail: 'Optional personalised recommendations and ad-personalisation signals.' }
];

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function consentModeFor(consent: ConsentState) {
  return {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.ads ? 'granted' : 'denied',
    ad_user_data: consent.ads ? 'granted' : 'denied',
    ad_personalization: consent.personalisation ? 'granted' : 'denied'
  } as const;
}

function publishConsentState(consent: ConsentState) {
  if (typeof window === 'undefined') return;
  window.groceryviewConsent = { policyVersion: CONSENT_POLICY_VERSION, categories: consent };
  window.dispatchEvent(new CustomEvent('groceryview:consent-updated', { detail: window.groceryviewConsent }));
}

function applyConsentDefault() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || gtag;
  window.gtag('consent', 'default', deniedConsentMode);
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'allow_ad_personalization_signals', false);
  publishConsentState({ necessary: true, analytics: false, ads: false, personalisation: false });
}

function applyConsentUpdate(consent: ConsentState) {
  if (typeof window === 'undefined') return;
  window.gtag = window.gtag || gtag;
  window.gtag('consent', 'update', consentModeFor(consent));
  window.gtag('set', 'ads_data_redaction', !consent.ads);
  window.gtag('set', 'allow_ad_personalization_signals', consent.ads && consent.personalisation);
  publishConsentState(consent);
}

function persistConsent(choice: ConsentState, action: 'accept all' | 'reject all' | 'manage') {
  const auditEntry = {
    policyVersion: CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    action,
    categories: choice,
    framework: 'IAB TCF v2.2 category disclosure with Google Consent Mode v2 signals'
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ policyVersion: CONSENT_POLICY_VERSION, categories: choice }));
  localStorage.setItem(CONSENT_AUDIT_KEY, JSON.stringify(auditEntry));
  applyConsentUpdate(choice);
}

function loadStoredConsent(): ConsentState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || 'null') as { policyVersion?: string; categories?: ConsentState } | null;
    if (!parsed || parsed.policyVersion !== CONSENT_POLICY_VERSION || !parsed.categories) return null;
    return { ...parsed.categories, necessary: true };
  } catch {
    return null;
  }
}

export function ConsentManager() {
  const denied = useMemo<ConsentState>(() => ({ necessary: true, analytics: false, ads: false, personalisation: false }), []);
  const granted = useMemo<ConsentState>(() => ({ necessary: true, analytics: true, ads: true, personalisation: true }), []);
  const [visible, setVisible] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(denied);
  const [storageChecked, setStorageChecked] = useState(false);
  const rejectAllRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    applyConsentDefault();
    const stored = loadStoredConsent();
    if (stored) {
      setDraft(stored);
      applyConsentUpdate(stored);
      setVisible(false);
      setStorageChecked(true);
      return;
    }
    setVisible(true);
    setStorageChecked(true);
  }, [denied]);

  function choose(choice: ConsentState, action: 'accept all' | 'reject all' | 'manage') {
    const normalized = { ...choice, necessary: true };
    persistConsent(normalized, action);
    setDraft(normalized);
    setVisible(false);
    setManageOpen(false);
  }

  useEffect(() => {
    if (visible && storageChecked && !manageOpen) rejectAllRef.current?.focus();
  }, [manageOpen, storageChecked, visible]);

  if (!visible) {
    return (
      <button
        className="fixed bottom-3 left-3 z-50 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-lg"
        onClick={() => {
          setVisible(true);
          setManageOpen(true);
        }}
        type="button"
      >
        Cookie settings
      </button>
    );
  }

  return (
    <section className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-5xl rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl" aria-label="Cookie consent banner">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">IAB TCF v2.2 consent preferences</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">Choose how GroceryView may use cookies and signals</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            We default analytics, ads, ad user data, and ad personalisation to denied. AdSense remains non-personalised until optional consent is granted.
            Your proof is stored locally with policyVersion and timestamp; a new policy version asks again.
            You can change choices any time via Cookie settings; optional trackers stay blocked until their category is granted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" onClick={() => choose(denied, 'reject all')} ref={rejectAllRef} type="button">Reject all</button>
          <button className="rounded-full border border-emerald-700 px-4 py-2 text-sm font-black text-emerald-900" onClick={() => setManageOpen((open) => !open)} type="button">Manage</button>
          <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" onClick={() => choose(granted, 'accept all')} type="button">Accept all</button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm font-black text-emerald-800">
        <Link className="underline decoration-emerald-300 underline-offset-4" href="/privacy">
          Read privacy details
        </Link>
        <Link className="underline decoration-emerald-300 underline-offset-4" href="/cookies">
          Read cookie details
        </Link>
        <Link className="underline decoration-emerald-300 underline-offset-4" href="/sv/privacy">
          Integritetspolicy
        </Link>
        <Link className="underline decoration-emerald-300 underline-offset-4" href="/en/privacy">
          Privacy policy
        </Link>
        <Link className="underline decoration-emerald-300 underline-offset-4" href="/sv/cookies">
          Cookiepolicy
        </Link>
        <Link className="underline decoration-emerald-300 underline-offset-4" href="/en/cookies">
          Cookie policy
        </Link>
      </div>
      {manageOpen ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {categories.map((category) => (
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm" key={category.key}>
              <span className="flex items-center justify-between gap-2 font-black text-slate-950">
                {category.label}
                <input
                  checked={draft[category.key]}
                  disabled={category.locked}
                  onChange={(event) => setDraft((current) => ({ ...current, [category.key]: event.target.checked, necessary: true }))}
                  type="checkbox"
                />
              </span>
              <span className="mt-2 block leading-5 text-slate-600">{category.detail}</span>
            </label>
          ))}
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white md:col-span-4" onClick={() => choose(draft, 'manage')} type="button">
            Save managed choices
          </button>
        </div>
      ) : null}
    </section>
  );
}
