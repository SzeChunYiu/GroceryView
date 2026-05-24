import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

export type ErrorDetails = unknown;

export type StandardApiError = {
  code: string;
  message: string;
  details?: ErrorDetails;
};

export type StandardApiErrorResponse = {
  error: StandardApiError;
};

type UnknownRecord = Record<string, unknown>;

const statusToCode = (status: number): string => {
  return HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';
};

const messageFromHttpResponse = (response: unknown): string | undefined => {
  if (typeof response === 'string') return response;
  if (!response || typeof response !== 'object' || Array.isArray(response)) return undefined;

  const raw = response as UnknownRecord;
  const message = raw.message;

  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join(', ');

  return undefined;
};

const detailsFromHttpResponse = (response: unknown): ErrorDetails | undefined => {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return undefined;

  const raw = response as UnknownRecord;
  if ('details' in raw) return raw.details;
  if ('error' in raw || 'statusCode' in raw || 'message' in raw || 'errors' in raw) return raw;
  return undefined;
};

@Catch()
export class ErrorHandler implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      return;
    }

    const response = host.switchToHttp().getResponse<{ status: (statusCode: number) => void; json: (body: unknown) => void }>();

    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawResponse = exception instanceof HttpException ? exception.getResponse() : undefined;

    const message =
      messageFromHttpResponse(rawResponse) ?? (exception instanceof Error ? exception.message : 'Internal server error');

    const details = detailsFromHttpResponse(rawResponse);

    const payload: StandardApiErrorResponse = {
      error: {
        code: statusToCode(statusCode),
        message,
        ...(details === undefined ? {} : { details })
      }
    };

    response.status(statusCode).json(payload);
  }
}
