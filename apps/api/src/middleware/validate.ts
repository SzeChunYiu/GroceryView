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

export function optionalSingleQueryParameter(
  query: Record<string, unknown>,
  parameterName: string
): string | undefined {
  const value = query[parameterName];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') return value;
  throw new BadRequestException(`${parameterName} must be a single query parameter`);
}

export function optionalBoundedIntegerQueryParameter(
  query: Record<string, unknown>,
  parameterName: string,
  options: { defaultValue: number; max: number; min: number }
): number {
  const value = optionalSingleQueryParameter(query, parameterName);
  if (value === undefined) return options.defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || String(parsed) !== value.trim()) {
    throw new BadRequestException(`${parameterName} must be an integer`);
  }
  if (parsed < options.min || parsed > options.max) {
    throw new BadRequestException(`${parameterName} must be between ${options.min} and ${options.max}`);
  }
  return parsed;
}
