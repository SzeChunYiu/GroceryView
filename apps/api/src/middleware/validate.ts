import { BadRequestException } from '@nestjs/common';

export function validateNoUnexpectedQueryParameters(
  query: Record<string, unknown>,
  allowedParameters: readonly string[],
  routeName: string
): void {
  const allowed = new Set(allowedParameters);
  const unexpected = Object.keys(query ?? {}).filter((key) => !allowed.has(key)).sort((a, b) => a.localeCompare(b));
  if (unexpected.length > 0) {
    throw new BadRequestException(`Unexpected query parameter for ${routeName}: ${unexpected.join(', ')}`);
  }
}

export function parseRequiredStringArrayQuery(value: unknown, name: string, maxItems: number): string[] {
  const rawValues = Array.isArray(value) ? value : [value];
  const items = rawValues
    .flatMap((raw) => typeof raw === 'string' ? raw.split(',') : [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) throw new BadRequestException(`${name} query parameter is required.`);
  if (items.length > maxItems) throw new BadRequestException(`${name} supports at most ${maxItems} items.`);
  return [...new Set(items)];
}
