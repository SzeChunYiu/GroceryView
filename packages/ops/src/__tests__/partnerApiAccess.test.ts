import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPartnerApiAccessPlan } from '../index.js';

describe('partner API access ops', () => {
  it('marks partner API access ready when keys, export formats, provenance, and SLA controls pass', () => {
    const plan = buildPartnerApiAccessPlan({
      tier: 'growth',
      partnerName: 'Retail Insights AB',
      issuedApiKeys: 2,
      rateLimitPerMinute: 500,
      allowedExportFormats: ['parquet', 'json'],
      includesPriceProvenance: true,
      includesRegionalAggregates: true,
      includesCategoryIndices: true,
      dataLatencyMinutes: 45,
      signedDataProcessingAgreement: true
    });

    assert.deepEqual(plan, {
      status: 'ready',
      tier: 'growth',
      partnerName: 'Retail Insights AB',
      rateLimitPerMinute: 500,
      enabledCapabilities: ['price_provenance', 'regional_aggregates', 'category_indices', 'hourly_refresh', 'daily_refresh'],
      exportFormats: ['json', 'parquet'],
      blockers: [],
      summary: 'Partner API access is ready.'
    });
  });

  it('fails closed with actionable blockers for an incomplete enterprise API launch', () => {
    const plan = buildPartnerApiAccessPlan({
      tier: 'enterprise',
      partnerName: 'City Basket Index',
      issuedApiKeys: 0,
      rateLimitPerMinute: 900,
      allowedExportFormats: [],
      includesPriceProvenance: false,
      includesRegionalAggregates: true,
      includesCategoryIndices: false,
      dataLatencyMinutes: 1800,
      signedDataProcessingAgreement: false
    });

    assert.deepEqual(plan.status, 'blocked');
    assert.deepEqual(plan.enabledCapabilities, ['regional_aggregates']);
    assert.deepEqual(plan.blockers, [
      'api_keys_not_issued',
      'rate_limit_below_enterprise_minimum',
      'no_export_formats_enabled',
      'price_provenance_not_included',
      'data_processing_agreement_not_signed',
      'data_latency_above_daily_sla'
    ]);
  });
});
