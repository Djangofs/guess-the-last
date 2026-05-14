import { sql } from 'drizzle-orm';
import { createDb, createPool } from './client';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://gtlp_user:gtlp_pass@localhost:5432/guess_the_last_pokemon';

describe('database connection and schema', () => {
  const pool = createPool(DATABASE_URL);
  const db = createDb(pool);

  afterAll(async () => {
    await pool.end();
  });

  it('connects to the database', async () => {
    const result = await db.execute(sql`SELECT 1 AS value`);
    expect(result.rows[0]).toEqual({ value: 1 });
  });

  it('has a pokemon table', async () => {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'pokemon'
    `);
    expect(result.rows).toHaveLength(1);
  });

  it('has a game table', async () => {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'game'
    `);
    expect(result.rows).toHaveLength(1);
  });

  it('game table has a foreign key to pokemon', async () => {
    const result = await db.execute(sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'game' AND constraint_type = 'FOREIGN KEY'
    `);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
  });
});
