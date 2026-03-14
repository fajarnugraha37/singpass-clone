import { describe, it, expect, mock } from 'bun:test';
import { FapiErrors, fapiErrorHandler, FapiError } from '../../src/infra/middleware/fapi-error';
import { Context } from 'hono';

describe('FapiErrors and Middleware', () => {
  describe('FapiErrors Factory', () => {
    it('should create invalid_request error', () => {
      const err = FapiErrors.invalidRequest('test');
      expect(err.error).toBe('invalid_request');
      expect(err.status).toBe(400);
    });

    it('should create invalid_client error', () => {
      const err = FapiErrors.invalidClient('test');
      expect(err.error).toBe('invalid_client');
      expect(err.status).toBe(401);
    });

    it('should create invalid_grant error', () => {
      const err = FapiErrors.invalidGrant('test');
      expect(err.error).toBe('invalid_grant');
      expect(err.status).toBe(400);
    });

    it('should create unauthorized_client error', () => {
      const err = FapiErrors.unauthorizedClient('test');
      expect(err.error).toBe('unauthorized_client');
    });

    it('should create unsupported_grant_type error', () => {
      const err = FapiErrors.unsupportedGrantType('test');
      expect(err.error).toBe('unsupported_grant_type');
    });

    it('should create invalid_scope error', () => {
      const err = FapiErrors.invalidScope('test');
      expect(err.error).toBe('invalid_scope');
    });

    it('should create invalid_dpop_proof error', () => {
      const err = FapiErrors.invalidDpopProof('test');
      expect(err.error).toBe('invalid_dpop_proof');
    });
  });

  describe('fapiErrorHandler Middleware', () => {
    it('should catch FapiError and return JSON', async () => {
      const c = {
        json: mock((data: any, status: number) => ({ data, status })),
      } as unknown as Context;
      const next = async () => {
        throw FapiErrors.invalidClient('Unrecognized client');
      };

      const res: any = await fapiErrorHandler(c, next);
      expect(res.status).toBe(401);
      expect(res.data.error).toBe('invalid_client');
      expect(res.data.error_description).toBe('Unrecognized client');
    });

    it('should catch unexpected error and return 500', async () => {
      const c = {
        json: mock((data: any, status: number) => ({ data, status })),
      } as unknown as Context;
      const next = async () => {
        throw new Error('Database down');
      };

      const res: any = await fapiErrorHandler(c, next);
      expect(res.status).toBe(500);
      expect(res.data.error).toBe('invalid_request');
    });

    it('should call next if no error', async () => {
      let called = false;
      const c = {} as Context;
      const next = async () => {
        called = true;
      };

      await fapiErrorHandler(c, next);
      expect(called).toBe(true);
    });
  });
});
