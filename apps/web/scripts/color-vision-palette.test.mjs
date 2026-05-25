import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const paletteUrl = new URL('../src/lib/color-vision-palette.tokens.json', import.meta.url);
const deficiencyMatrices = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ],
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525]
  ]
};

function parseHex(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  assert.ok(match, `${value} must be a six-digit hex color`);
  const integer = Number.parseInt(match[1], 16);
  return [(integer >> 16) & 255, (integer >> 8) & 255, integer & 255].map((channel) => channel / 255);
}

function simulate(rgb, matrix) {
  return matrix.map((row) => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])));
}

function linear(channel) {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground, background, matrix) {
  const fg = luminance(simulate(parseHex(foreground), matrix));
  const bg = luminance(simulate(parseHex(background), matrix));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

async function readPalette() {
  return JSON.parse(await readFile(paletteUrl, 'utf8'));
}

describe('color-vision-safe state palette', () => {
  it('covers critical grocery price states with non-color indicators', async () => {
    const palette = await readPalette();
    assert.deepEqual(Object.keys(palette.price), ['cheap', 'market', 'expensive', 'unavailable']);
    assert.deepEqual(Object.keys(palette.deal), ['up', 'flat', 'down']);
    assert.deepEqual(Object.keys(palette.freshness), ['fresh', 'aging', 'stale']);
    assert.deepEqual(Object.keys(palette.confidence), ['high', 'medium', 'low']);

    for (const [groupName, group] of Object.entries(palette)) {
      const indicators = Object.values(group).map((token) => token.indicator);
      assert.equal(new Set(indicators).size, indicators.length, `${groupName} indicators must be unique within the group`);
      for (const [tokenName, token] of Object.entries(group)) {
        assert.ok(token.indicator.trim(), `${groupName}.${tokenName} needs a visible non-color indicator`);
        assert.ok(token.label.trim(), `${groupName}.${tokenName} needs a text label`);
        assert.ok(token.meaning.trim(), `${groupName}.${tokenName} needs semantic meaning text`);
      }
    }
  });

  it('keeps token foreground/background contrast under common color-vision deficiencies', async () => {
    const palette = await readPalette();
    const failures = [];

    for (const [groupName, group] of Object.entries(palette)) {
      for (const [tokenName, token] of Object.entries(group)) {
        for (const [deficiencyName, matrix] of Object.entries(deficiencyMatrices)) {
          const ratio = contrast(token.foreground, token.background, matrix);
          if (ratio < 4.5) failures.push(`${groupName}.${tokenName}.${deficiencyName}:${ratio.toFixed(2)}`);
        }
      }
    }

    assert.deepEqual(failures, []);
  });
});
