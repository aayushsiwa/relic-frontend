import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';

import { pool } from './db';

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: [user.email],
        subject: 'Reset your password',
        text: `Click the link below to reset your password:\n\n${url}`,
        html: `<p>Click <a href="${url}">here</a> to reset your password. If you did not request this, you can safely ignore it.</p>`,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: [user.email],
        subject: 'Verify your email',
        text: `Click the link below to verify your email:\n\n${url}`,
        html: `<p>Click <a href="${url}">here</a> to verify your email. If you did not request this, you can safely ignore it.</p>`,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendEmail({
          to: [user.email],
          subject: 'Confirm your email change',
          text: `Click the link below to confirm changing your email to ${newEmail}:\n\n${url}`,
          html: `<p>Click <a href="${url}">here</a> to confirm changing your email to <strong>${newEmail}</strong>. If you did not request this, you can safely ignore it.</p>`,
        });
      },
    },
  },
  plugins: [bearer()],
});
