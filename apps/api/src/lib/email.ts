import {
  createTransactionalEmailClient,
  type CreateTransactionalEmailClientOptions,
  type TransactionalEmailClient,
  type TransactionalEmailFetch,
  type TransactionalEmailMessage,
  type TransactionalEmailProvider
} from '@groceryview/notifications';

export {
  createTransactionalEmailClient,
  type CreateTransactionalEmailClientOptions,
  type TransactionalEmailClient,
  type TransactionalEmailFetch,
  type TransactionalEmailMessage,
  type TransactionalEmailProvider
};

export type VerificationEmailInput = {
  appName?: string;
  to: string;
  verificationUrl: string;
};

export function buildVerificationEmailMessage(input: VerificationEmailInput): TransactionalEmailMessage {
  const appName = input.appName ?? 'GroceryView';
  return {
    to: input.to,
    subject: `Verify your ${appName} email`,
    text: [
      `Welcome to ${appName}.`,
      '',
      'Verify your email address before creating price alerts or shopping lists:',
      input.verificationUrl,
      '',
      'If you did not create this account, you can ignore this message.'
    ].join('\n'),
    metadata: {
      type: 'email_verification',
      app: appName
    }
  };
}

export function createResendVerificationEmailClient(input: {
  env?: NodeJS.ProcessEnv;
  fetch?: TransactionalEmailFetch;
} = {}): TransactionalEmailClient {
  const env = input.env ?? process.env;
  const apiKey = env.RESEND_API_KEY?.trim();
  const fromEmail = env.RESEND_FROM_EMAIL?.trim() || env.EMAIL_FROM?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is required to send verification email.');
  if (!fromEmail) throw new Error('RESEND_FROM_EMAIL or EMAIL_FROM is required to send verification email.');
  return createTransactionalEmailClient({ provider: 'resend', apiKey, fromEmail, fetch: input.fetch });
}
