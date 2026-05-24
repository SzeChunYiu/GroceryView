import assert from 'node:assert/strict';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { StoresController } from '../src/stores/stores.controller.js';

describe('StoresController nearest endpoint parsing', () => {
  it('passes numeric query parameters to the nearest store service', async () => {
    const calls: unknown[] = [];
    const controller = new StoresController(
      { isConfigured: () => true } as never,
      {
        isConfigured: () => true,
        nearest: async (input: unknown) => {
          calls.push(input);
          return [{ slug: 'coop-odenplan', distanceKm: 1.86 }];
        }
      } as never
    );

    const response = await controller.nearest('59.3293', '18.0686', '5', 'coop');

    assert.deepEqual(calls[0], { latitude: 59.3293, longitude: 18.0686, radiusKm: 5, chain: 'coop' });
    assert.deepEqual(response, {
      lat: 59.3293,
      lng: 18.0686,
      radiusKm: 5,
      chain: 'coop',
      stores: [{ slug: 'coop-odenplan', distanceKm: 1.86 }]
    });
  });

  it('fails closed for missing database config and invalid coordinates', async () => {
    const controller = new StoresController(
      { isConfigured: () => true } as never,
      { isConfigured: () => false, nearest: async () => [] } as never
    );

    await assert.rejects(
      () => controller.nearest('59.3293', '18.0686', '5'),
      ServiceUnavailableException
    );

    const configured = new StoresController(
      { isConfigured: () => true } as never,
      { isConfigured: () => true, nearest: async () => [] } as never
    );

    await assert.rejects(
      () => configured.nearest('not-a-number', '18.0686', '5'),
      BadRequestException
    );
  });
});
