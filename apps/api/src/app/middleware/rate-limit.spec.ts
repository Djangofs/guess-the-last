import { standardLimiterOptions, strictLimiterOptions } from './rate-limit';

describe('rate limiter options', () => {
  it('standardLimiter allows 100 requests per 15 minutes', () => {
    expect(standardLimiterOptions.limit).toBe(100);
    expect(standardLimiterOptions.windowMs).toBe(15 * 60 * 1000);
  });

  it('strictLimiter allows 10 requests per 15 minutes', () => {
    expect(strictLimiterOptions.limit).toBe(10);
    expect(strictLimiterOptions.windowMs).toBe(15 * 60 * 1000);
  });
});
