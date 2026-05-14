import { Pool } from 'pg';
import { createDb, createPool } from './client';

jest.mock('pg', () => {
  const mockPool = jest.fn().mockImplementation((config) => ({ config }));
  return { Pool: mockPool };
});

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn().mockImplementation((pool, opts) => ({ pool, opts })),
}));

describe('createPool', () => {
  it('creates a Pool with the given connection string', () => {
    const url = 'postgresql://user:pass@localhost:5432/db';
    createPool(url);
    expect(Pool).toHaveBeenCalledWith({ connectionString: url });
  });
});

describe('createDb', () => {
  it('creates a drizzle instance from the given pool', () => {
    const { drizzle } = jest.requireMock('drizzle-orm/node-postgres');
    const pool = createPool('postgresql://user:pass@localhost:5432/db');
    createDb(pool as unknown as Pool);
    expect(drizzle).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({ schema: expect.any(Object) }),
    );
  });
});
