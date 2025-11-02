import { defineConfig } from 'drizzle-kit';
import { ENV } from './src/utils/env';
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: ENV.DATABASE_URL,
  },
});