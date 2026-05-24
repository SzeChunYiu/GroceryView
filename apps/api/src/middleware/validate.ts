import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z, type ZodIssue, type ZodSchema } from 'zod';

type JsonIssue = {
  path: string;
  code: string;
  message: string;
};

type ValidationErrorBody = {
  statusCode: number;
  error: string;
  message: string;
  issues: JsonIssue[];
};

function issueToJson(issue: ZodIssue): JsonIssue {
  return {
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message
  };
}

export class ValidateBodyPipe<TSchema extends ZodSchema>(private readonly schema: TSchema) implements PipeTransform {
  transform(value: unknown): z.infer<TSchema> {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request body validation failed',
        issues: parsed.error.issues.map(issueToJson)
      } satisfies ValidationErrorBody);
    }
    return parsed.data;
  }
}

export function validateBody<TSchema extends ZodSchema>(schema: TSchema) {
  return new ValidateBodyPipe(schema);
}
