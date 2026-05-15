import { eq } from 'drizzle-orm';
import { createDb, createPool } from '../db/client';
import * as schema from '../db/schema';
import { importReplays } from './replay-service';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://gtlp_user:gtlp_pass@localhost:5433/guess_the_last_pokemon';

describe('importReplays (integration)', () => {
  const pool = createPool(DATABASE_URL);
  const db = createDb(pool);

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await db.delete(schema.team);
    await db.delete(schema.replay);
  });

  it('imports a real replay URL and persists two teams in reveal order', async () => {
    const url = 'https://replay.pokemonshowdown.com/smogtours-gen4ou-900386';

    const result = await importReplays(db, [url]);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);

    const replays = await db
      .select()
      .from(schema.replay)
      .where(eq(schema.replay.replayUrl, url));
    expect(replays).toHaveLength(1);
    expect(replays[0].format).toMatch(/gen\d/);

    const teams = await db
      .select()
      .from(schema.team)
      .where(eq(schema.team.replayId, replays[0].id));
    expect(teams).toHaveLength(2);

    const players = teams.map((t) => t.player).sort();
    expect(players).toEqual(['p1', 'p2']);

    for (const t of teams) {
      expect(t.pokemonIds).toHaveLength(6);
      expect(t.pokemonIds.every((id) => typeof id === 'number')).toBe(true);
    }
  }, 30_000);

  it('skips already-imported URLs without error', async () => {
    const url = 'https://replay.pokemonshowdown.com/smogtours-gen4ou-900386';

    await importReplays(db, [url]);
    const second = await importReplays(db, [url]);

    expect(second.imported).toBe(0);
    expect(second.skipped).toBe(1);
    expect(second.failed).toBe(0);

    const replays = await db
      .select()
      .from(schema.replay)
      .where(eq(schema.replay.replayUrl, url));
    expect(replays).toHaveLength(1);
  }, 30_000);
});
