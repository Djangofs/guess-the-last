import { Router } from 'express';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { requireApiKey } from '../middleware/require-api-key';
import { strictLimiter } from '../middleware/rate-limit';
import { importReplays } from './replay-service';
import { ImportReplaysRequest } from '@guess-the-last/shared-types';

type Db = NodePgDatabase<typeof schema>;

export const createReplayRouter = (db: Db) => {
  const router = Router();

  router.post(
    '/replays/import',
    strictLimiter,
    requireApiKey,
    async (req, res) => {
      const body = req.body as ImportReplaysRequest;

      if (!Array.isArray(body?.urls) || body.urls.length === 0) {
        res.status(400).json({ error: 'urls must be a non-empty array' });
        return;
      }

      const result = await importReplays(db, body.urls);
      res.json(result);
    },
  );

  return router;
};
