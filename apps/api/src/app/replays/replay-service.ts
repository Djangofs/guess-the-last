import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { ReplayRepository, createReplayRepository } from './replay-repository';
import { parseReplayLog } from './parse-replay-log';

type Db = NodePgDatabase<typeof schema>;

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ReplayService {
  importReplays(urls: string[]): Promise<ImportResult>;
}

const extractFormat = (url: string): string => {
  const slug = url.split('/').pop() ?? '';
  const match = slug.match(/-(gen\d+[a-z0-9]+)-/);
  return match ? match[1] : 'unknown';
};

const fetchReplayLog = async (url: string): Promise<{ log: string }> => {
  const jsonUrl = url.endsWith('.json') ? url : `${url}.json`;
  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${jsonUrl}: ${res.status}`);
  const data = (await res.json()) as { log: string };
  return { log: data.log };
};

const importReplays = async (
  repo: ReplayRepository,
  urls: string[],
): Promise<ImportResult> => {
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const url of urls) {
    try {
      if (await repo.existsByUrl(url)) {
        skipped++;
        continue;
      }

      const { log } = await fetchReplayLog(url);
      const { p1, p2 } = parseReplayLog(log);
      const format = extractFormat(url);

      const p1Result = await repo.resolvePokemonIds(p1);
      const p2Result = await repo.resolvePokemonIds(p2);

      if (p1Result.missing.length > 0) {
        errors.push(
          `${url}: unknown Pokémon for p1: ${p1Result.missing.join(', ')}`,
        );
        failed++;
        continue;
      }
      if (p2Result.missing.length > 0) {
        errors.push(
          `${url}: unknown Pokémon for p2: ${p2Result.missing.join(', ')}`,
        );
        failed++;
        continue;
      }
      if (p1Result.ids.length !== 6 || p2Result.ids.length !== 6) {
        errors.push(`${url}: team does not have exactly 6 Pokémon`);
        failed++;
        continue;
      }

      await repo.createWithTeams({
        url,
        format,
        p1Ids: p1Result.ids,
        p2Ids: p2Result.ids,
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

export const createReplayService = (db: Db): ReplayService => {
  const repo = createReplayRepository(db);
  return {
    importReplays: (urls) => importReplays(repo, urls),
  };
};
