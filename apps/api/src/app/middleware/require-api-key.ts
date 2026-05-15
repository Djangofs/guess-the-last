import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.API_SECRET;

  if (!secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);

  if (
    tokenBuf.length !== secretBuf.length ||
    !timingSafeEqual(tokenBuf, secretBuf)
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
