import { createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { config, getEmailProvider } from './config';

export type SendEmailParams = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

// Send email via the serverless email-service
// (https://github.com/aayushsiwa/email-service). Requires EMAIL_SERVICE_URL
// and EMAIL_SERVICE_API_KEY in env.
export async function sendEmailService({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<void> {
  const serviceUrl = config.email.serviceUrl;
  const apiKey = config.email.apiKey;

  if (!serviceUrl || !apiKey) {
    throw new Error('EMAIL_SERVICE_URL and EMAIL_SERVICE_API_KEY are not set.');
  }

  const res = await fetch(`${serviceUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email service responded ${res.status}: ${body}`);
  }
}

/**
 * Send an email via SMTP, using environment variables for config.
 *
 * Required env vars:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (number)
 * - SMTP_USER: User/login for SMTP auth
 * - SMTP_PASS: Password for SMTP auth
 * - SMTP_SECURE: true for TLS/SSL, false for STARTTLS/none (default: false)
 */
export async function sendEmailSMTP({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<void> {
  const host = config.email.smtp.host;
  const port: number = Number(config.email.smtp.port) || 587;
  const user = config.email.smtp.user;
  const pass = config.email.smtp.pass;
  const secure: boolean = Boolean(config.email.smtp.secure);

  if (!host || !user || !pass || !port) {
    throw new Error(
      'SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must all be set.'
    );
  }

  const smtpOptions: SMTPTransport.Options = {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };

  const transporter = createTransport(smtpOptions);

  // Use first address in "to" for plain "to", rest as bcc (safe default)
  let toField = '';
  let bccField: string[] = [];
  if (to && to.length > 0) {
    toField = to[0];
    if (to.length > 1) bccField = to.slice(1);
  } else {
    throw new Error('No recipients (to) provided.');
  }

  const mailOptions = {
    from: user, // sender address
    to: toField,
    bcc: bccField.length > 0 ? bccField : undefined,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    // Optionally log: info.messageId, info.accepted, info.rejected
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    throw new Error(
      `SMTP send failed: ${err && err.message ? err.message : err}`
    );
  }
}

/**
 * Unified email send function.
 * Uses the active provider, based on getEmailProvider().
 * All app code should use this.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = getEmailProvider();
  if (provider === 'email-service') {
    return sendEmailService(params);
  }
  return sendEmailSMTP(params);
}
