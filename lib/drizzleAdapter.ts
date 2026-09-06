import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';

import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg', // or "sqlite" or "mysql"
  }),
  out: './drizzle',
  //... the rest of your config
});
