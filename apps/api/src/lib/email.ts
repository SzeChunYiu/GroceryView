export type FeedbackEmailPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendFeedbackEmail(payload: FeedbackEmailPayload): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const toEmail = process.env.FEEDBACK_TO_EMAIL?.trim();

  if (!apiKey) {
    throw new Error('feedback configuration: RESEND_API_KEY is required.');
  }
  if (!fromEmail) {
    throw new Error('feedback configuration: RESEND_FROM_EMAIL is required.');
  }
  if (!toEmail) {
    throw new Error('feedback configuration: FEEDBACK_TO_EMAIL is required.');
  }

  const subject = `Feedback from ${payload.name}${payload.subject ? ` - ${payload.subject}` : ''}`;
  const body = [
    `From: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.subject ? `Subject: ${payload.subject}` : null,
    '',
    payload.message
  ]
    .filter(Boolean)
    .join('\n');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      html: `<pre>${escapeHtml(body)}</pre>`,
      text: body
    })
  });

  const responseBody = await parseJsonBody(response);
  if (!response.ok) {
    const reason = readString(responseBody, 'message') ?? `${response.status} ${response.statusText}`;
    throw new Error(`feedback delivery failed: ${reason}`);
  }

  const messageId = readString(responseBody, 'id');
  if (!messageId) throw new Error('feedback delivery failed: missing message id.');

  return messageId;
}

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : undefined;
}

async function parseJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
