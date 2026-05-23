import { BadRequestException } from '@nestjs/common';

export type ParsedItemsQuery = {
  category: string[];
  store?: string;
  onSale?: boolean;
  organic?: boolean;
  q?: string;
  page: number;
  pageSize: number;
};

type RawItemsQuery = Record<string, unknown>;

function toStringList(value: unknown): string[] {
  if (value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []));
  }

  if (typeof value === 'string') {
    return value.split(',');
  }

  throw new BadRequestException('Query parameter `category` must be a comma-separated list or repeated query key.');
}

function parsePositiveInt(input: unknown, name: string): number | undefined {
  if (input === undefined) return undefined;

  const value = typeof input === 'string' ? Number(input) : undefined;
  if (Number.isNaN(value) || !Number.isInteger(value) || !Number.isFinite(value)) {
    throw new BadRequestException(`Query parameter '${name}' must be a positive integer.`);
  }
  if (value <= 0) {
    throw new BadRequestException(`Query parameter '${name}' must be a positive integer.`);
  }
  return value;
}

function parseBoolean(input: unknown, name: string): boolean | undefined {
  if (input === undefined) return undefined;

  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase();
    if (normalized === '' || ['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }

  throw new BadRequestException(`Query parameter '${name}' must be true or false.`);
}

function parseSearch(input: unknown, name: string): string | undefined {
  if (input === undefined) return undefined;
  if (typeof input !== 'string') {
    throw new BadRequestException(`Query parameter '${name}' must be a string.`);
  }

  const value = input.trim();
  return value.length === 0 ? undefined : value;
}

export function parseItemsQuery(query: RawItemsQuery): ParsedItemsQuery {
  const category = toStringList(query.category);
  const store = parseSearch(query.store, 'store');
  const onSale = parseBoolean(query.onSale, 'onSale');
  const organic = parseBoolean(query.organic, 'organic');
  const q = parseSearch(query.q, 'q');

  return {
    category: category.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0),
    ...(store ? { store } : {}),
    ...(onSale !== undefined ? { onSale } : {}),
    ...(organic !== undefined ? { organic } : {}),
    ...(q ? { q } : {}),
    page: parsePositiveInt(query.page, 'page') ?? 1,
    pageSize: parsePositiveInt(query.pageSize, 'pageSize') ?? 10
  };
}
