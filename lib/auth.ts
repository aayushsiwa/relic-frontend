import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';

import { pool } from './db';

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [bearer()],
});
