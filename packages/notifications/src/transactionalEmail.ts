export type TransactionalEmailProvider = 'resend' | 'postmark';

export type TransactionalEmailMessage = {
  to: string;
  subject: string;
  text: string;
  metadata?: Record<string, string>;
};

export type TransactionalEmailClient = {
  send(message: TransactionalEmailMessage): Promise<string>;
};

export type TransactionalEmailFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export type CreateTransactionalEmailClientOptions = {
  provider: TransactionalEmailProvider;
  apiKey: string;
  fromEmail: string;
  fetch?: TransactionalEmailFetch;
};

const resendEndpoint = 'https://api.resend.com/emails';
const postmarkEndpoint = 'https://api.postmarkapp.com/email';

export function createTransactionalEmailClient(
  options: CreateTransactionalEmailClientOptions
): TransactionalEmailClient {
  const fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis);

  if (!fetchImpl) {
    throw new Error('Transactional email requires a fetch implementation.');
  }

  return {
    send: async (message) => {
      if (options.provider === 'resend') {
        return sendResendEmail(options, message, fetchImpl);
      }

      return sendPostmarkEmail(options, message, fetchImpl);
    }
  };
}

async function sendResendEmail(
  options: CreateTransactionalEmailClientOptions,
  message: TransactionalEmailMessage,
  fetchImpl: TransactionalEmailFetch
): Promise<string> {
  const body = {
    from: options.fromEmail,
    to: [message.to],
    subject: message.subject,
    text: message.text,
    tags: metadataToTags(message.metadata)
  };

  const response = await fetchImpl(resendEndpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  await assertEmailAccepted(response, 'Resend');

  const payload = (await response.json()) as { id?: unknown };
  if (typeof payload.id !== 'string' || payload.id.length === 0) {
    throw new Error('Resend accepted the request without returning an email id.');
  }

  return payload.id;
}

async function sendPostmarkEmail(
  options: CreateTransactionalEmailClientOptions,
  message: TransactionalEmailMessage,
  fetchImpl: TransactionalEmailFetch
): Promise<string> {
  const body = {
    From: options.fromEmail,
    To: message.to,
    Subject: message.subject,
    TextBody: message.text,
    Metadata: message.metadata ?? {}
  };

  const response = await fetchImpl(postmarkEndpoint, {
    method: 'POST',
    headers: {
      'x-postmark-server-token': options.apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  await assertEmailAccepted(response, 'Postmark');

  const payload = (await response.json()) as { MessageID?: unknown };
  if (typeof payload.MessageID !== 'string' || payload.MessageID.length === 0) {
    throw new Error('Postmark accepted the request without returning an email id.');
  }

  return payload.MessageID;
}

async function assertEmailAccepted(response: Response, provider: string): Promise<void> {
  if (response.ok) {
    return;
  }

  const detail = await response.text().catch(() => '');
  const suffix = detail.length > 0 ? `: ${detail}` : '';
  throw new Error(`${provider} rejected transactional email request (${response.status})${suffix}`);
}

function metadataToTags(metadata: Record<string, string> | undefined): Array<{ name: string; value: string }> {
  return Object.entries(metadata ?? {}).map(([name, value]) => ({ name, value }));
}
