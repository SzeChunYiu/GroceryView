export type ThirdPartyCategory = 'analytics' | 'ads' | 'maps' | 'charts' | 'tag-manager' | 'widget';
export type ThirdPartyConsentCategory = 'analytics' | 'ads' | 'personalisation';
export type ThirdPartyLoadTrigger = 'consent' | 'consent+visibility' | 'consent+interaction+visibility';

export type ThirdPartyInventoryEntry = {
  id: string;
  category: ThirdPartyCategory;
  owner: string;
  consentCategory: ThirdPartyConsentCategory;
  loadTrigger: ThirdPartyLoadTrigger;
  allowedHosts: string[];
  maxInitialJsBytes: number;
  maxLongTaskMs: number;
  notes: string;
};

export type ThirdPartyConsentSnapshot = {
  policyVersion?: string;
  categories?: Partial<Record<'necessary' | ThirdPartyConsentCategory, boolean>>;
};

export type ConsentSafeThirdPartyScriptRequest = {
  id: string;
  src: string;
  consent: ThirdPartyConsentSnapshot | null;
  interacted: boolean;
  visible: boolean;
};

export const THIRD_PARTY_TOTAL_JS_BUDGET_BYTES = 70_000;
export const THIRD_PARTY_LONG_TASK_BUDGET_MS = 50;

export const thirdPartyInventory: ThirdPartyInventoryEntry[] = [
  {
    id: 'google-consent-mode',
    category: 'tag-manager',
    owner: 'web',
    consentCategory: 'analytics',
    loadTrigger: 'consent',
    allowedHosts: ['www.googletagmanager.com'],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 0,
    notes: 'Consent defaults are first-party only; optional Google tags must be loaded through the consent-safe loader after analytics consent.'
  },
  {
    id: 'analytics-events',
    category: 'analytics',
    owner: 'web',
    consentCategory: 'analytics',
    loadTrigger: 'consent',
    allowedHosts: [],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 0,
    notes: 'Current analytics events are first-party CustomEvents/dataLayer pushes gated by stored analytics consent.'
  },
  {
    id: 'ads',
    category: 'ads',
    owner: 'web',
    consentCategory: 'ads',
    loadTrigger: 'consent+visibility',
    allowedHosts: ['pagead2.googlesyndication.com', 'googleads.g.doubleclick.net'],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 0,
    notes: 'No ad script is loaded today; any future ad script must stay denied until ads consent and visible ad inventory.'
  },
  {
    id: 'google-maps-embed',
    category: 'maps',
    owner: 'web',
    consentCategory: 'personalisation',
    loadTrigger: 'consent+interaction+visibility',
    allowedHosts: ['www.google.com'],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 0,
    notes: 'Google Maps embeds are iframes, not page JavaScript, and stay unloaded until consent, viewport visibility, and shopper interaction.'
  },
  {
    id: 'maplibre-tiles',
    category: 'maps',
    owner: 'web',
    consentCategory: 'personalisation',
    loadTrigger: 'consent+visibility',
    allowedHosts: ['tiles.openfreemap.org'],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 50,
    notes: 'MapLibre is bundled first-party by route; remote tile requests should only start when map routes mount.'
  },
  {
    id: 'lightweight-charts',
    category: 'charts',
    owner: 'web',
    consentCategory: 'analytics',
    loadTrigger: 'consent+visibility',
    allowedHosts: [],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 50,
    notes: 'Chart library is bundled first-party by chart routes; no external chart vendor script is allowed.'
  },
  {
    id: 'grocery-index-widget',
    category: 'widget',
    owner: 'web',
    consentCategory: 'analytics',
    loadTrigger: 'consent+visibility',
    allowedHosts: ['grocery-web-mu.vercel.app'],
    maxInitialJsBytes: 0,
    maxLongTaskMs: 50,
    notes: 'Embeddable Grocery Index widget is first-party and should remain lazy iframe content for publishers.'
  }
];

export function thirdPartyInventoryById(id: string) {
  return thirdPartyInventory.find((entry) => entry.id === id) ?? null;
}

export function totalThirdPartyInitialJsBudgetBytes() {
  return thirdPartyInventory.reduce((sum, entry) => sum + entry.maxInitialJsBytes, 0);
}

export function thirdPartyConsentGranted(entry: ThirdPartyInventoryEntry, consent: ThirdPartyConsentSnapshot | null) {
  return consent?.categories?.[entry.consentCategory] === true;
}

export function thirdPartyHostAllowed(entry: ThirdPartyInventoryEntry, src: string) {
  if (entry.allowedHosts.length === 0) return false;
  try {
    const host = new URL(src).hostname;
    return entry.allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  } catch {
    return false;
  }
}

export function canLoadConsentSafeThirdPartyScript(request: ConsentSafeThirdPartyScriptRequest) {
  const entry = thirdPartyInventoryById(request.id);
  if (!entry) return false;
  if (!thirdPartyHostAllowed(entry, request.src)) return false;
  if (!thirdPartyConsentGranted(entry, request.consent)) return false;
  if (entry.loadTrigger.includes('visibility') && !request.visible) return false;
  if (entry.loadTrigger.includes('interaction') && !request.interacted) return false;
  return true;
}

export function loadConsentSafeThirdPartyScript(request: ConsentSafeThirdPartyScriptRequest) {
  if (typeof document === 'undefined') return null;
  if (!canLoadConsentSafeThirdPartyScript(request)) return null;

  const existing = document.querySelector<HTMLScriptElement>(`script[data-third-party-id="${request.id}"]`);
  if (existing) return existing;

  const script = document.createElement('script');
  script.async = true;
  script.dataset.thirdPartyId = request.id;
  script.src = request.src;
  document.head.appendChild(script);
  return script;
}
