export type PasswordResetEmailInput = {
  email: string;
  resetUrl: string;
  expiresAt: string;
};

export type PasswordResetEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function buildPasswordResetEmail(input: PasswordResetEmailInput): PasswordResetEmailPayload {
  const subject = 'Reset your GroceryView password';
  const previewText = `Open this secure link to reset your password: ${input.resetUrl}`;

  return {
    to: input.email,
    subject,
    text: `${previewText}\n\nThis link expires at ${input.expiresAt}. If you did not request this, ignore this email.`,
    html: `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;">\n<p>${previewText}</p>\n<p><a href="${input.resetUrl}">Reset password</a></p>\n<p>Expires: ${input.expiresAt}</p>\n<p>If you did not request this, you can ignore this email.</p>\n</body></html>`
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailPayload): Promise<void> {
  // In the API sandbox there is no production SMTP provider yet.
  // We keep this helper as a no-op sender so route tests can verify the
  // message payload that would be queued by a transport layer.
  console.log(`[email] to=${input.to} subject=${input.subject}`);
}
