import { describe, expect, it } from 'vitest';

import { buildExpiryDealRadar, type ExpiryDealReport } from '../../index.js';

const now = '2026-02-14T10:00:00.000Z';

const realExpiryReports: ExpiryDealReport[] = [
  {
    id: 'report-lidl-yogurt-2026-02-14',
    productId: 'arla-greek-yogurt-1kg',
    productName: 'Arla Greek yogurt 1 kg',
    storeId: 'lidl-lund-central',
    storeName: 'Lidl Lund Central',
    category: 'dairy',
    originalPrice: 40,
    currentPrice: 18,
    markdownPercent: 55,
    expiresAt: '2026-02-14T18:00:00.000Z',
    reportedAt: '2026-02-14T08:00:00.000Z',
    distanceKm: 0.8,
    verificationCount: 2,
    photoCount: 1
  },
  {
    id: 'report-ica-sourdough-2026-02-14',
    productId: 'ica-sourdough-loaf',
    productName: 'ICA sourdough loaf',
    storeId: 'ica-malmö-triangeln',
    storeName: 'ICA Malmö Triangeln',
    category: 'bakery',
    originalPrice: 30,
    currentPrice: 21,
    markdownPercent: 30,
    expiresAt: '2026-02-15T22:00:00.000Z',
    reportedAt: '2026-02-14T07:00:00.000Z',
    distanceKm: 2.1,
    verificationCount: 1,
    photoCount: 0
  },
  {
    id: 'report-coop-salad-2026-02-13',
    productId: 'coop-caesar-salad',
    productName: 'Coop Caesar salad bowl',
    storeId: 'coop-lund-c',
    storeName: 'Coop Lund C',
    category: 'ready-meal',
    originalPrice: 55,
    currentPrice: 25,
    markdownPercent: 55,
    expiresAt: '2026-02-14T09:00:00.000Z',
    reportedAt: '2026-02-14T06:30:00.000Z',
    distanceKm: 1.4,
    verificationCount: 3,
    photoCount: 1
  }
];

describe('buildExpiryDealRadar', () => {
  it('ranks active expiry deals and keeps expired reports as stale evidence', () => {
    const radar = buildExpiryDealRadar({ reports: realExpiryReports, now });

    expect(radar.staleReportIds).toEqual(['report-coop-salad-2026-02-13']);
    expect(radar.stores).toHaveLength(2);
    expect(radar.stores[0]).toMatchObject({
      storeId: 'lidl-lund-central',
      topMarkdownPercent: 55,
      items: [
        expect.objectContaining({
          id: 'report-lidl-yogurt-2026-02-14',
          savings: 22,
          hoursUntilExpiry: 8,
          urgency: 'expires_today',
          verification: 'verified',
          radarScore: 100
        })
      ]
    });
    expect(radar.stores[1]?.items[0]).toMatchObject({
      id: 'report-ica-sourdough-2026-02-14',
      urgency: 'expires_soon',
      verification: 'needs_confirmation',
      radarScore: 57
    });
    expect(radar.alerts).toEqual([
      {
        reportId: 'report-lidl-yogurt-2026-02-14',
        productId: 'arla-greek-yogurt-1kg',
        storeId: 'lidl-lund-central',
        type: 'expiry_markdown',
        message: 'Arla Greek yogurt 1 kg is 55% off at Lidl Lund Central before expiry.'
      }
    ]);
  });

  it('returns empty radar sections for empty input', () => {
    expect(buildExpiryDealRadar({ reports: [], now })).toEqual({
      stores: [],
      alerts: [],
      staleReportIds: []
    });
  });

  it('rejects a report missing a timestamp field', () => {
    const [reportWithoutReportedAt] = realExpiryReports;
    const malformedReport = { ...reportWithoutReportedAt! } as Partial<ExpiryDealReport>;
    delete malformedReport.reportedAt;

    expect(() => buildExpiryDealRadar({
      reports: [malformedReport as ExpiryDealReport],
      now
    })).toThrow('report dates must be valid ISO dates.');
  });
});
