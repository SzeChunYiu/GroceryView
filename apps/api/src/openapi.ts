import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

export type QueryType = 'string' | 'number' | 'integer' | 'boolean';

export const jsonResponseSchema = {
  type: 'object',
  additionalProperties: true
} as const;

export const jsonArrayResponseSchema = {
  type: 'array',
  items: { type: 'object', additionalProperties: true }
} as const;

export const csvResponseSchema = {
  type: 'string',
  format: 'binary'
} as const;

export const jsonResponse = (description: string) =>
  ApiOkResponse({
    description,
    schema: jsonResponseSchema
  });

export const jsonArrayResponse = (description: string) =>
  ApiOkResponse({
    description,
    schema: jsonArrayResponseSchema
  });

export const jsonCreatedResponse = (description: string) =>
  ApiCreatedResponse({
    description,
    schema: jsonResponseSchema
  });

export const csvResponse = (description: string) =>
  ApiOkResponse({
    description,
    schema: csvResponseSchema
  });

export const query = (name: string, required: boolean, description: string, example?: string | number | boolean, type: QueryType = 'string') =>
  ApiQuery({
    name,
    required,
    description,
    example,
    type
  });

export const queryArray = (name: string, required: boolean, description: string, example?: string[]) =>
  ApiQuery({
    name,
    required,
    description,
    example,
    type: [String],
    isArray: true
  });

export const param = (name: string, required: boolean, description: string) =>
  ApiParam({
    name,
    required,
    description,
    type: String
  });

export const body = (description: string, schema: Record<string, unknown>) =>
  ApiBody({
    description,
    schema
  });
