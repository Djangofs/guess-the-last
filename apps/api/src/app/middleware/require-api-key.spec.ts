import { NextFunction, Request, Response } from 'express';
import { requireApiKey } from './require-api-key';

const makeReq = (authHeader?: string): Request =>
  ({
    headers: authHeader ? { authorization: authHeader } : {},
  }) as unknown as Request;

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('requireApiKey', () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when API_SECRET is not set', () => {
    beforeEach(() => {
      delete process.env.API_SECRET;
    });

    it('returns 401', () => {
      const res = makeRes();
      requireApiKey(makeReq('Bearer anything'), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when API_SECRET is set', () => {
    beforeEach(() => {
      process.env.API_SECRET = 'correct-secret';
    });

    afterEach(() => {
      delete process.env.API_SECRET;
    });

    it('returns 401 when Authorization header is missing', () => {
      const res = makeRes();
      requireApiKey(makeReq(), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header is not a Bearer token', () => {
      const res = makeRes();
      requireApiKey(makeReq('Basic dXNlcjpwYXNz'), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is wrong', () => {
      const res = makeRes();
      requireApiKey(makeReq('Bearer wrong-secret'), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when token is correct', () => {
      const res = makeRes();
      requireApiKey(makeReq('Bearer correct-secret'), res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
