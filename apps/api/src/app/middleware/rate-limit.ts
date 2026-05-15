import rateLimit, { Options } from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MESSAGE = {
  error: 'Too many requests, please try again later.',
};

export const standardLimiterOptions: Partial<Options> = {
  windowMs: WINDOW_MS,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
};

export const strictLimiterOptions: Partial<Options> = {
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
};

export const standardLimiter = rateLimit(standardLimiterOptions);
export const strictLimiter = rateLimit(strictLimiterOptions);
