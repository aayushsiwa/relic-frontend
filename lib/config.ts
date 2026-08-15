export const config = {
  email: {
    serviceUrl: process.env.EMAIL_SERVICE_URL,
    apiKey: process.env.EMAIL_SERVICE_API_KEY,
    smtp: {
      host: process.env.SMTP_HOST ?? '',
      port: process.env.SMTP_PORT ?? 587,
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      secure: process.env.SMTP_SECURE ?? false,
    },
    // If/when toggling by provider or feature flags:
    // provider: process.env.EMAIL_SERVICE_PROVIDER ?? 'email-service',
    emailRequired: ((): boolean => {
      const val = process.env.EMAIL_REQUIRED_FOR_SIGNUP;
      if (val === undefined) return true;
      return ["true","1","yes","y"].includes(val.trim().toLowerCase());
    })(),
  },
  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
  },
  auth: {
    secret: process.env.BETTER_AUTH_SECRET ?? '',
    url: process.env.BETTER_AUTH_URL ?? '',
  },
};

/**
 * Helper to detect chosen email provider (for migration/feature flag/testing use).
 * Defaults to 'email-service' if config present, else 'smtp'.
 */
export function getEmailProvider(): 'email-service' | 'smtp' {
  if (process.env.EMAIL_SERVICE_URL && process.env.EMAIL_SERVICE_API_KEY) {
    return 'email-service';
  }
  return 'smtp';
}

export type AppConfig = typeof config;
