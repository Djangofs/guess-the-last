import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

type Db = NodePgDatabase<typeof schema>;

export interface ReplayRepository {
  existsByUrl(url: string): Promise<boolean>;
  resolvePokemonIds(
    names: string[],
  ): Promise<{ ids: number[]; missing: string[] }>;
  createWithTeams(params: {
    url: string;
    format: string;
    p1Ids: number[];
    p2Ids: number[];
  }): Promise<void>;
}

export const createReplayRepository = (db: Db): ReplayRepository => ({
  existsByUrl: async (url) => {
    const rows = await db
      .select({ id: schema.replay.id })
      .from(schema.replay)
      .where(eq(schema.replay.replayUrl, url));
    return rows.length > 0;
  },

  resolvePokemonIds: async (names) => {
    const ids: number[] = [];
    const missing: string[] = [];
    for (const name of names) {
      const rows = await db
        .select({ id: schema.pokemon.id })
        .from(schema.pokemon)
        .where(eq(schema.pokemon.name, name.toLowerCase()));
      if (rows.length === 0) {
        missing.push(name);
      } else {
        ids.push(rows[0].id);
      }
    }
    return { ids, missing };
  },

  createWithTeams: async ({ url, format, p1Ids, p2Ids }) => {
    await db.transaction(async (tx) => {
      const [insertedReplay] = await tx
        .insert(schema.replay)
        .values({ replayUrl: url, format })
        .returning({ id: schema.replay.id });

      await tx.insert(schema.team).values([
        { replayId: insertedReplay.id, player: 'p1', pokemonIds: p1Ids },
        { replayId: insertedReplay.id, player: 'p2', pokemonIds: p2Ids },
      ]);
    });
  },
});
