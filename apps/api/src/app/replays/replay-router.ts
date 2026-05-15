import { Router } from 'express';
import { requireApiKey } from '../middleware/require-api-key';
import { strictLimiter } from '../middleware/rate-limit';
import { ReplayService } from './replay-service';

export const createReplayRouter = (service: ReplayService) => {
  const router = Router();

  router.post(
    '/replays/import',
    strictLimiter,
    requireApiKey,
    async (req, res) => {
      const body = req.body as { urls: string[] };

      if (!Array.isArray(body?.urls) || body.urls.length === 0) {
        res.status(400).json({ error: 'urls must be a non-empty array' });
        return;
      }

      const result = await service.importReplays(body.urls);
      res.json(result);
    },
  );

  return router;
};
