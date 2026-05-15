import express from 'express';
import { standardLimiter } from './app/middleware/rate-limit';

if (!process.env.API_SECRET) {
  console.warn(
    'WARNING: API_SECRET is not set. All protected routes will reject requests.',
  );
}

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(express.json());
app.use(standardLimiter);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
