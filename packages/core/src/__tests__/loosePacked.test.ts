import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChannelTrackingKey, detectLoosePackedChannel } from '../index.js';

describe('detectLoosePackedChannel', () => {
  it('detects loose-weight Swedish and unit-price language', () => {
    const detection = detectLoosePackedChannel('Bananer lös vikt pris/kg 24,90 kr/kg');

    assert.equal(detection.channel, 'loose');
    assert.equal(detection.confidence, 'high');
    assert.ok(detection.looseSignals.includes('lös vikt'));
  });

  it('detects pre-packed packaging language', () => {
    const detection = detectLoosePackedChannel('Nötfärs 500 g tråg förpackning');

    assert.equal(detection.channel, 'pre_packed');
    assert.equal(detection.confidence, 'high');
    assert.ok(detection.prePackedSignals.includes('tråg'));
  });

  it('marks mixed text when the same canonical product can appear in both store channels', () => {
    const detection = detectLoosePackedChannel({
      title: 'Äpplen lös vikt',
      packageText: 'Även 1 kg paket'
    });

    assert.equal(detection.channel, 'mixed');
    assert.ok(detection.looseSignals.length > 0);
    assert.ok(detection.prePackedSignals.length > 0);
  });

  it('detects in-store counter service channels for meat deli and fish', () => {
    assert.equal(detectLoosePackedChannel('Entrecote from manuell köttdisk 329 kr/kg').channel, 'counter_meat');
    assert.equal(detectLoosePackedChannel('Skivad salami från charkdisk').channel, 'counter_deli');
    assert.equal(detectLoosePackedChannel('Laxfilé fiskdisk pris/kg').channel, 'counter_fish');
  });

  it('keeps store/canonical observations separate by channel', () => {
    assert.notEqual(
      buildChannelTrackingKey({ storeId: 'ica-city', canonicalId: 'apple-red', channel: 'loose' }),
      buildChannelTrackingKey({ storeId: 'ica-city', canonicalId: 'apple-red', channel: 'pre_packed' })
    );
  });
});
