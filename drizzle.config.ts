import { defineConfig } from 'drizzle-kit';

import { config } from './lib/config';

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.db.url,
  },
});
