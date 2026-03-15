import { describe, it, expect } from 'bun:test';
import { FapiErrors, FapiError } from '../../../../src/infra/middleware/fapi-error';

describe('FapiErrors', () => {
  describe('invalidToken', () => {
    it('should create an error with error code "invalid_token" and status 400', () => {
      const error = FapiErrors.invalidToken('Invalid token provided');
      expect(error).toBeInstanceOf(FapiError);
      expect(error.error).toBe('invalid_token');
      expect(error.description).toBe('Invalid token provided');
      expect(error.status).toBe(400);
    });

    it('should create an error with only the error code when no description is provided', () => {
      const error = FapiErrors.invalidToken();
      expect(error).toBeInstanceOf(FapiError);
      expect(error.error).toBe('invalid_token');
      expect(error.description).toBeUndefined();
      expect(error.status).toBe(400);
    });
  });

  describe('serverError', () => {
    it('should create an error with error code "server_error" and status 500', () => {
      const error = FapiErrors.serverError('Internal server issue');
      expect(error).toBeInstanceOf(FapiError);
      expect(error.error).toBe('server_error');
      expect(error.description).toBe('Internal server issue');
      expect(error.status).toBe(500);
    });

    it('should create an error with only the error code when no description is provided', () => {
      const error = FapiErrors.serverError();
      expect(error).toBeInstanceOf(FapiError);
      expect(error.error).toBe('server_error');
      expect(error.description).toBeUndefined();
      expect(error.status).toBe(500);
    });
  });

  describe('temporarilyUnavailable', () => {
    it('should create an error with error code "temporarily_unavailable" and status 503', () => {
      const error = FapiErrors.temporarilyUnavailable('Service is temporarily down');
      expect(error).toBeInstanceOf(FapiError);
      expect(error.error).toBe('temporarily_unavailable');
      expect(error.description).toBe('Service is temporarily down');
      expect(error.status).toBe(503);
    });

    it('should create an error with only the error code when no description is provided', () => {
      const error = FapiErrors.temporarilyUnavailable();
      expect(error).toBeInstanceOf(FapiError);
      expect(error.error).toBe('temporarily_unavailable');
      expect(error.description).toBeUndefined();
      expect(error.status).toBe(503);
    });
  });
});
