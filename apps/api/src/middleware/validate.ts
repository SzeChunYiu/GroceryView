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
