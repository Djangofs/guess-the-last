import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const createPool = (connectionString: string) =>
  new Pool({ connectionString });

export const createDb = (pool: Pool) => drizzle(pool, { schema });
