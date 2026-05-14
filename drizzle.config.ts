import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './apps/api/src/app/db/schema.ts',
  out: './apps/api/src/app/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
} satisfies Config;
