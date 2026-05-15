import express from 'express';
import { createDb, createPool } from './app/db/client';
import { standardLimiter } from './app/middleware/rate-limit';
import { createReplayRepository } from './app/replays/replay-repository';
import { createReplayRouter } from './app/replays/replay-router';

if (!process.env.API_SECRET) {
  console.warn(
    'WARNING: API_SECRET is not set. All protected routes will reject requests.',
  );
}

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://gtlp_user:gtlp_pass@localhost:5433/guess_the_last_pokemon';

const pool = createPool(databaseUrl);
const db = createDb(pool);
const replayRepo = createReplayRepository(db);

const app = express();
app.use(express.json());
app.use(standardLimiter);

app.use('/api', createReplayRouter(replayRepo));

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
