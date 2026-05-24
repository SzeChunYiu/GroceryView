export type OcrScanCorrectionStatus = 'corrections_pending' | 'corrected' | 'export_ready';

export type OcrScanHistoryEntry = {
  capturedAtLabel: string;
  correctionStatus: OcrScanCorrectionStatus;
  id: string;
  lineItemSummary: string;
  retailerLabel: string;
  statusLabel: string;
};

export type OcrScanHistoryTimeline = {
  apiPathTemplate: string;
  emptyState: string;
  entries: OcrScanHistoryEntry[];
  entitlement: 'premium';
  privacyCopy: string;
  title: string;
};

export const premiumOcrHistoryTimeline: OcrScanHistoryTimeline = {
  title: 'Premium OCR scan history timeline',
  entitlement: 'premium',
  apiPathTemplate: '/api/scans/history?userId=:userId',
  privacyCopy: 'Static fallback is redacted: no receipt images, raw OCR text, item prices, or correction history are embedded before a premium account session is verified.',
  emptyState: 'Sign in with Premium to load account-bound OCR scan history from private storage.',
  entries: [
    {
      id: 'redacted-latest-scan',
      capturedAtLabel: 'Latest previous scan',
      retailerLabel: 'Retailer hidden until sign-in',
      lineItemSummary: 'Line-item count hidden in static fallback',
      correctionStatus: 'corrections_pending',
      statusLabel: 'Corrections pending'
    },
    {
      id: 'redacted-corrected-scan',
      capturedAtLabel: 'Earlier previous scan',
      retailerLabel: 'Retailer hidden until sign-in',
      lineItemSummary: 'Corrected row count loads after entitlement check',
      correctionStatus: 'corrected',
      statusLabel: 'Corrected'
    },
    {
      id: 'redacted-export-ready-scan',
      capturedAtLabel: 'Older previous scan',
      retailerLabel: 'Retailer hidden until sign-in',
      lineItemSummary: 'Export status only; private rows stay server-side',
      correctionStatus: 'export_ready',
      statusLabel: 'Export ready'
    }
  ]
};

export function getScanHistoryEndpoint(userId: string) {
  return `/api/scans/history?userId=${encodeURIComponent(userId)}`;
}
