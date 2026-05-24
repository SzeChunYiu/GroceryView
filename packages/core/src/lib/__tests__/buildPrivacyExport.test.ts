import { describe, expect, it } from 'vitest';
import { buildPrivacyExport, type PrivacyExportInput } from '../../index.js';

const generatedAt = '2026-05-21T09:30:00.000Z';

describe('buildPrivacyExport', () => {
  it('builds a complete privacy export from grocery fixtures', () => {
    const input: PrivacyExportInput = {
      userId: 'user-stockholm-family',
      lists: [{ id: 'weekly-basket', storeId: 'willys-odenplan', itemCount: 3 }],
      alerts: [{ id: 'coffee-price-drop', productId: 'zoegas-skane', thresholdSek: 49 }],
      preferences: [{ key: 'weekly_budget_sek', value: 900 }],
      analyticsEvents: [{ event: 'privacy_export_requested', occurredAt: '2026-05-20T12:00:00.000Z' }],
      favoriteStoreIds: ['willys-odenplan', 'ica-sabbatsberg'],
      watchlistProductIds: ['zoegas-skane', 'arla-mellanmjolk'],
      receiptIds: ['receipt-2026-05-18-willys'],
      householdIds: ['household-odenplan']
    };

    expect(buildPrivacyExport(input, generatedAt)).toEqual({
      userId: 'user-stockholm-family',
      generatedAt,
      sections: [
        { name: 'profile', records: [{ userId: 'user-stockholm-family' }] },
        { name: 'lists', records: [{ id: 'weekly-basket', storeId: 'willys-odenplan', itemCount: 3 }] },
        { name: 'alerts', records: [{ id: 'coffee-price-drop', productId: 'zoegas-skane', thresholdSek: 49 }] },
        { name: 'preferences', records: [{ key: 'weekly_budget_sek', value: 900 }] },
        { name: 'analytics_events', records: [{ event: 'privacy_export_requested', occurredAt: '2026-05-20T12:00:00.000Z' }] },
        { name: 'favorite_stores', records: [{ storeId: 'willys-odenplan' }, { storeId: 'ica-sabbatsberg' }] },
        { name: 'watchlist', records: [{ productId: 'zoegas-skane' }, { productId: 'arla-mellanmjolk' }] },
        { name: 'receipts', records: [{ receiptId: 'receipt-2026-05-18-willys' }] },
        { name: 'households', records: [{ householdId: 'household-odenplan' }] }
      ]
    });
  });

  it('keeps every export section when optional record inputs are empty', () => {
    const input: PrivacyExportInput = {
      userId: 'user-empty-export',
      favoriteStoreIds: [],
      watchlistProductIds: [],
      receiptIds: [],
      householdIds: []
    };

    expect(buildPrivacyExport(input, generatedAt)).toEqual({
      userId: 'user-empty-export',
      generatedAt,
      sections: [
        { name: 'profile', records: [{ userId: 'user-empty-export' }] },
        { name: 'lists', records: [] },
        { name: 'alerts', records: [] },
        { name: 'preferences', records: [] },
        { name: 'analytics_events', records: [] },
        { name: 'favorite_stores', records: [] },
        { name: 'watchlist', records: [] },
        { name: 'receipts', records: [] },
        { name: 'households', records: [] }
      ]
    });
  });

  it('throws when a required id collection is missing from malformed input', () => {
    const malformedInput = {
      userId: 'user-missing-favorites',
      watchlistProductIds: ['zoegas-skane'],
      receiptIds: ['receipt-2026-05-18-willys'],
      householdIds: ['household-odenplan']
    } as unknown as PrivacyExportInput;

    expect(() => buildPrivacyExport(malformedInput, generatedAt)).toThrow(TypeError);
  });
});
