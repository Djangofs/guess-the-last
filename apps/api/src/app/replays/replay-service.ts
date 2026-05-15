import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { parseReplayLog } from './parse-replay-log';

type Db = NodePgDatabase<typeof schema>;

interface ReplayFetchResult {
  log: string;
}

const extractFormat = (url: string): string => {
  const slug = url.split('/').pop() ?? '';
  const match = slug.match(/-(gen\d+[a-z0-9]+)-/);
  return match ? match[1] : 'unknown';
};

const fetchReplayLog = async (url: string): Promise<ReplayFetchResult> => {
  const jsonUrl = url.endsWith('.json') ? url : `${url}.json`;
  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${jsonUrl}: ${res.status}`);
  const data = (await res.json()) as { log: string };
  return { log: data.log };
};

const resolveSpeciesToIds = async (
  db: Db,
  species: string[],
): Promise<{ ids: number[]; missing: string[] }> => {
  const ids: number[] = [];
  const missing: string[] = [];

  for (const name of species) {
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
};

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export const importReplays = async (
  db: Db,
  urls: string[],
): Promise<ImportResult> => {
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const existing = await db
        .select({ id: schema.replay.id })
        .from(schema.replay)
        .where(eq(schema.replay.replayUrl, url));

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const { log } = await fetchReplayLog(url);
      const { p1, p2 } = parseReplayLog(log);
      const format = extractFormat(url);

      const p1Result = await resolveSpeciesToIds(db, p1);
      const p2Result = await resolveSpeciesToIds(db, p2);

      if (p1Result.missing.length > 0) {
        const names = p1Result.missing.join(', ');
        errors.push(`${url}: unknown Pokémon for p1: ${names}`);
        failed++;
        continue;
      }
      if (p2Result.missing.length > 0) {
        const names = p2Result.missing.join(', ');
        errors.push(`${url}: unknown Pokémon for p2: ${names}`);
        failed++;
        continue;
      }
      if (p1Result.ids.length !== 6 || p2Result.ids.length !== 6) {
        errors.push(`${url}: team does not have exactly 6 Pokémon`);
        failed++;
        continue;
      }

      await db.transaction(async (tx) => {
        const [insertedReplay] = await tx
          .insert(schema.replay)
          .values({ replayUrl: url, format })
          .returning({ id: schema.replay.id });

        await tx.insert(schema.team).values([
          {
            replayId: insertedReplay.id,
            player: 'p1',
            pokemonIds: p1Result.ids,
          },
          {
            replayId: insertedReplay.id,
            player: 'p2',
            pokemonIds: p2Result.ids,
          },
        ]);
      });

      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${url}: ${message}`);
      failed++;
    }
  }

  return { imported, skipped, failed, errors };
};
