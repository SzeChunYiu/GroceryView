export type CrossBrowserSmokeFeature = 'chart' | 'map' | 'camera-fallback' | 'forms' | 'navigation';

export type BrowserSpecificSkip = {
  browserName: 'chromium' | 'firefox' | 'webkit';
  feature: CrossBrowserSmokeFeature;
  reason: string;
  expiresOn: `${number}-${number}-${number}`;
  trackingIssue: string;
};

// Every browser-specific smoke skip must be added here with an expiry and tracking issue.
// Keep the list empty when Chromium, Firefox, and WebKit all run the full smoke matrix.
export const browserSpecificSkips: BrowserSpecificSkip[] = [];

export function browserSkipFor(browserName: string, feature: CrossBrowserSmokeFeature) {
  const skip = browserSpecificSkips.find((entry) => entry.browserName === browserName && entry.feature === feature);
  if (!skip) return null;

  const expiry = Date.parse(`${skip.expiresOn}T23:59:59.999Z`);
  if (!Number.isFinite(expiry)) {
    throw new Error(`Invalid browser skip expiry for ${skip.browserName}/${skip.feature}: ${skip.expiresOn}`);
  }
  if (expiry < Date.now()) {
    throw new Error(`Expired browser skip for ${skip.browserName}/${skip.feature}: ${skip.trackingIssue}`);
  }

  return `${skip.reason} (expires ${skip.expiresOn}; ${skip.trackingIssue})`;
}
