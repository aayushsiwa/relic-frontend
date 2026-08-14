type SendEmailParams = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

// Send email via the serverless email-service
// (https://github.com/aayushsiwa/email-service). Requires EMAIL_SERVICE_URL
// and EMAIL_SERVICE_API_KEY in env.
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<void> {
  const serviceUrl = process.env.EMAIL_SERVICE_URL;
  const apiKey = process.env.EMAIL_SERVICE_API_KEY;

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
