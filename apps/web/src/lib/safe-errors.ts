export type GroceryViewErrorCode =
  | 'source_blocked'
  | 'stale_data'
  | 'no_coverage'
  | 'parser_drift'
  | 'auth_required'
  | 'rate_limited'
  | 'validation_failed'
  | 'unknown';

export type SafeErrorMessage = {
  code: GroceryViewErrorCode;
  title: string;
  userMessage: string;
  actionLabel: string;
  logLevel: 'info' | 'warn' | 'error';
  retryable: boolean;
};

export class GroceryViewTypedError extends Error {
  readonly code: GroceryViewErrorCode;
  readonly operatorDetail: string;

  constructor(code: GroceryViewErrorCode, message: string, operatorDetail = message) {
    super(message);
    this.name = 'GroceryViewTypedError';
    this.code = code;
    this.operatorDetail = operatorDetail;
  }
}

const safeMessages: Record<GroceryViewErrorCode, SafeErrorMessage> = {
  source_blocked: {
    code: 'source_blocked',
    title: 'Source temporarily blocked',
    userMessage: 'The retailer source is blocking automated checks right now. Try again later or use another verified source.',
    actionLabel: 'Try again later',
    logLevel: 'warn',
    retryable: true
  },
  stale_data: {
    code: 'stale_data',
    title: 'Fresh price evidence needed',
    userMessage: 'The latest data is older than our freshness window, so we are not showing it as current.',
    actionLabel: 'Refresh data',
    logLevel: 'warn',
    retryable: true
  },
  no_coverage: {
    code: 'no_coverage',
    title: 'No verified coverage',
    userMessage: 'We do not have verified prices for this source or market yet.',
    actionLabel: 'Broaden filters',
    logLevel: 'info',
    retryable: false
  },
  parser_drift: {
    code: 'parser_drift',
    title: 'Source format changed',
    userMessage: 'The retailer changed its page or feed format. We have paused this result until the parser is updated.',
    actionLabel: 'Check another source',
    logLevel: 'error',
    retryable: false
  },
  auth_required: {
    code: 'auth_required',
    title: 'Sign in required',
    userMessage: 'Sign in to view account-only list, alert, or preference data.',
    actionLabel: 'Sign in',
    logLevel: 'info',
    retryable: false
  },
  rate_limited: {
    code: 'rate_limited',
    title: 'Too many requests',
    userMessage: 'This source is rate limited. Wait a moment before retrying.',
    actionLabel: 'Retry shortly',
    logLevel: 'warn',
    retryable: true
  },
  validation_failed: {
    code: 'validation_failed',
    title: 'Input needs review',
    userMessage: 'Some submitted values could not be validated. Review the highlighted fields and try again.',
    actionLabel: 'Review input',
    logLevel: 'info',
    retryable: false
  },
  unknown: {
    code: 'unknown',
    title: 'Something went wrong',
    userMessage: 'We could not complete this request. Retry once, then choose another verified route if it continues.',
    actionLabel: 'Try again',
    logLevel: 'error',
    retryable: true
  }
};

export function classifyErrorCode(error: unknown): GroceryViewErrorCode {
  if (error instanceof GroceryViewTypedError) return error.code;
  const message = error instanceof Error ? error.message : String(error);
  if (/captcha|blocked|robots|access denied/i.test(message)) return 'source_blocked';
  if (/stale|freshness|too old|expired/i.test(message)) return 'stale_data';
  if (/no coverage|missing coverage|no verified prices|zero rows/i.test(message)) return 'no_coverage';
  if (/parser|schema|unexpected token|format changed|drift/i.test(message)) return 'parser_drift';
  if (/auth|sign.?in|unauthori[sz]ed|forbidden/i.test(message)) return 'auth_required';
  if (/rate.?limit|429|too many/i.test(message)) return 'rate_limited';
  if (/validation|required|invalid/i.test(message)) return 'validation_failed';
  return 'unknown';
}

export function safeErrorMessage(error: unknown): SafeErrorMessage {
  return safeMessages[classifyErrorCode(error)];
}

export function operatorErrorLog(error: unknown) {
  const safe = safeErrorMessage(error);
  return {
    code: safe.code,
    logLevel: safe.logLevel,
    operatorDetail: error instanceof GroceryViewTypedError ? error.operatorDetail : error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  };
}
