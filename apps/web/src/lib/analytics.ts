export type ConsentPayload = {
  policyVersion?: string;
  categories?: {
    analytics?: boolean;
    ads?: boolean;
    necessary?: boolean;
    personalisation?: boolean;
  };
  analytics?: boolean;
  ads?: boolean;
  necessary?: boolean;
  personalisation?: boolean;
};

const CONSENT_STORAGE_KEY = 'groceryview:consent:state';

function readConsentState() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const rawValue = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as ConsentPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function hasAnalyticsFlag(payload: ConsentPayload | null): boolean {
  if (!payload) return false;

  if (payload.categories && typeof payload.categories === 'object' && payload.categories.analytics === true) {
    return true;
  }

  return payload.analytics === true;
}

export function hasAnalyticsConsent() {
  return hasAnalyticsFlag(readConsentState());
}
