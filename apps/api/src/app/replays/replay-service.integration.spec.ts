import { eq } from 'drizzle-orm';
import { createDb, createPool } from '../db/client';
import * as schema from '../db/schema';
import { createReplayService } from './replay-service';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://gtlp_user:gtlp_pass@localhost:5433/guess_the_last_pokemon';

const P1_NAMES = [
  'fixturepoke01',
  'fixturepoke02',
  'fixturepoke03',
  'fixturepoke04',
  'fixturepoke05',
  'fixturepoke06',
];
const P2_NAMES = [
  'fixturepoke07',
  'fixturepoke08',
  'fixturepoke09',
  'fixturepoke10',
  'fixturepoke11',
  'fixturepoke12',
];
const ALL_NAMES = [...P1_NAMES, ...P2_NAMES];
const BASE_ID = 90001;

const makeFakeLog = () => {
  const lines: string[] = [];
  P1_NAMES.forEach((name) => {
    lines.push(`|switch|p1a: ${name}|${name}, L100|100/100`);
  });
  P2_NAMES.forEach((name) => {
    lines.push(`|switch|p2a: ${name}|${name}, L100|100/100`);
  });
  return lines.join('\n');
};

const FAKE_URL = 'https://replay.pokemonshowdown.com/smogtours-gen4ou-999999';

describe('importReplays (integration)', () => {
  const pool = createPool(DATABASE_URL);
  const db = createDb(pool);
  const service = createReplayService(db);

  beforeAll(async () => {
    await db
      .insert(schema.pokemon)
      .values(
        ALL_NAMES.map((name, i) => ({
          id: BASE_ID + i,
          name,
          types: ['normal'],
          spriteUrl: null,
        })),
      )
      .onConflictDoNothing();
  });

  afterAll(async () => {
    for (let i = 0; i < ALL_NAMES.length; i++) {
      await db.delete(schema.pokemon).where(eq(schema.pokemon.id, BASE_ID + i));
    }
    await pool.end();
  });

  afterEach(async () => {
    await db.delete(schema.team);
    await db.delete(schema.replay);
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ log: makeFakeLog() }),
    } as Response);
  });

  it('imports a replay URL and persists two teams in reveal order', async () => {
    const result = await service.importReplays([FAKE_URL]);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);

    const replays = await db
      .select()
      .from(schema.replay)
      .where(eq(schema.replay.replayUrl, FAKE_URL));
    expect(replays).toHaveLength(1);
    expect(replays[0].format).toBe('gen4ou');

    const teams = await db
      .select()
      .from(schema.team)
      .where(eq(schema.team.replayId, replays[0].id));
    expect(teams).toHaveLength(2);

    const p1 = teams.find((t) => t.player === 'p1');
    const p2 = teams.find((t) => t.player === 'p2');
    expect(p1?.pokemonIds).toEqual(P1_NAMES.map((_, i) => BASE_ID + i));
    expect(p2?.pokemonIds).toEqual(
      P2_NAMES.map((_, i) => BASE_ID + P1_NAMES.length + i),
    );
  });

  it('skips already-imported URLs without error', async () => {
    await service.importReplays([FAKE_URL]);
    const second = await service.importReplays([FAKE_URL]);

    expect(second.imported).toBe(0);
    expect(second.skipped).toBe(1);
    expect(second.failed).toBe(0);

    const replays = await db
      .select()
      .from(schema.replay)
      .where(eq(schema.replay.replayUrl, FAKE_URL));
    expect(replays).toHaveLength(1);
  });
});
