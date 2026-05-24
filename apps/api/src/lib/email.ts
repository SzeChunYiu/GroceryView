const RESEND_API_ENDPOINT = 'https://api.resend.com/emails';

export type FeedbackMessage = {
  name?: string;
  email: string;
  subject?: string;
  message: string;
};

export type FeedbackDeliveryResult = {
  id?: string;
  to: string;
};

type ResendResponse = {
  id?: string;
  error?: string;
};

function trimString(value: string | undefined, maxLength: number): string {
  return (value ?? '').trim().slice(0, maxLength);
}

function resolveFeedbackConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const toEmail = process.env.RESEND_FEEDBACK_TO_EMAIL?.trim() || process.env.GROCERYVIEW_SUPPORT_EMAIL?.trim();

  return { apiKey, fromEmail, toEmail };
}

function buildSubject(input: FeedbackMessage) {
  return (
    trimString(
      input.subject?.length ? input.subject : `${input.name?.trim() ? `${input.name.trim()} says` : 'New'} feedback`,
      140
    ) || 'New support message'
  );
}

function buildEmailBody(input: FeedbackMessage, metadata: { requestIp?: string; userAgent?: string }) {
  const name = trimString(input.name, 120);
  const from = trimString(input.email, 255);
  const subject = trimString(input.subject, 140);
  const message = trimString(input.message, 2000);
  const escapedSubject = subject ? `Subject: ${subject}\n` : '';
  const signature = [
    `Name: ${name || 'Anonymous'}`,
    `Email: ${from}`,
    ...(metadata.requestIp ? [`IP: ${metadata.requestIp}`] : []),
    ...(metadata.userAgent ? [`User-Agent: ${metadata.userAgent}`] : []),
    'Source: /feedback form'
  ].join('\n');

  return `${escapedSubject}${signature}\n\nMessage:\n${message}`.trim();
}

export function isFeedbackTransportConfigured(): boolean {
  const { apiKey, fromEmail, toEmail } = resolveFeedbackConfig();
  return Boolean(apiKey && fromEmail && toEmail);
}

export async function sendFeedbackEmail(
  input: FeedbackMessage,
  metadata: { requestIp?: string; userAgent?: string } = {}
): Promise<FeedbackDeliveryResult> {
  const { apiKey, fromEmail, toEmail } = resolveFeedbackConfig();
  if (!apiKey || !fromEmail || !toEmail) {
    throw new Error(
      'Feedback email delivery is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and RESEND_FEEDBACK_TO_EMAIL.'
    );
  }

  const payload = {
    from: fromEmail,
    to: [toEmail],
    reply_to: [input.email],
    subject: buildSubject(input),
    text: buildEmailBody(input, metadata)
  } satisfies Record<string, unknown>;

  const response = await fetch(RESEND_API_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const rawBody = await response.text();
  let parsed: ResendResponse = {};
  try {
    parsed = rawBody ? (JSON.parse(rawBody) as ResendResponse) : {};
  } catch {
    // Keep compatibility with any non-JSON response body.
  }
  if (!response.ok || parsed.error) {
    throw new Error(parsed.error ?? `Failed to send feedback via Resend (HTTP ${response.status}).`);
  }

  return { id: parsed.id, to: toEmail };
}
