export const unknownUnitPriceLabel = 'Jämförpris saknas';
export const unitPriceDisplayUnits = ['kg', 'l', 'st', '100 g'];

const pieceUnits = new Set(['st', 'styck', 'piece', 'pieces', 'pcs', 'pc', 'each']);

function numericUnitPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function firstNumberFromText(value) {
  if (typeof value !== 'string') return null;
  const match = value.replace(/\s+/g, ' ').match(/(\d+(?:[,.]\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeUnitPriceDisplayUnit(value) {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .toLocaleLowerCase('sv-SE')
    .replace(/sek|kronor|kr\.?/g, '')
    .replace(/jämförpris|jamforpris|jfr-pris|jfrpris|compare price|unit price/g, '')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');

  if (!normalized) return null;
  if (/(^|[/\s])100\s*g\b|per\s*100\s*g|100g/.test(normalized)) return '100 g';
  if (/(^|[/\s])kg\b|kilogram/.test(normalized)) return 'kg';
  if (/(^|[/\s])l\b|liter|litre/.test(normalized)) return 'l';

  const compact = normalized.replace(/[^a-zåäö0-9]+/g, ' ').trim();
  if (compact.split(' ').some((part) => pieceUnits.has(part))) return 'st';
  return null;
}

export function formatUnitPriceLabel(value, unit, options = {}) {
  const amount = numericUnitPrice(value);
  const displayUnit = normalizeUnitPriceDisplayUnit(unit);
  const unknownLabel = options.unknownLabel ?? unknownUnitPriceLabel;
  if (amount === null || displayUnit === null) return unknownLabel;

  const money = new Intl.NumberFormat(options.locale ?? 'sv-SE', {
    style: 'currency',
    currency: options.currency ?? 'SEK',
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  }).format(amount).replace(/[\u00a0\u202f]/g, ' ');

  return `${money}/${displayUnit}`;
}

export function formatPer100gUnitPriceLabel(valuePerKg, options = {}) {
  const amount = numericUnitPrice(valuePerKg);
  if (amount === null) return options.unknownLabel ?? unknownUnitPriceLabel;
  return formatUnitPriceLabel(amount / 10, '100 g', options);
}

export function formatSourceUnitPriceText(text, unit, options = {}) {
  const amount = firstNumberFromText(text);
  const displayUnit = normalizeUnitPriceDisplayUnit(unit) ?? normalizeUnitPriceDisplayUnit(text);
  if (amount === null || displayUnit === null) return options.unknownLabel ?? unknownUnitPriceLabel;
  return formatUnitPriceLabel(amount, displayUnit, options);
}
