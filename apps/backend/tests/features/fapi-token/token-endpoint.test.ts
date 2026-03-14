import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { TokenExchangeUseCase } from '../../src/core/use-cases/token-exchange';
import { exchangeToken } from '../../src/infra/http/controllers/token.controller';
import { FapiErrors, FapiError } from '../../src/infra/middleware/fapi-error';

// Mock dependencies and use case
const mockTokenExchangeUseCase: Mock<TokenExchangeUseCase> = {
  execute: vi.fn(),
} as Mock<TokenExchangeUseCase>;

// Mock Hono app and context
const app = new Hono();
let c: Context;

// Helper to create a mock context
const createMockContext = (request: Request): Context => {
  const ctx = app.newContext(request);
  // Mocking parseBody to return JSON
  ctx.req.parseBody = async () => Object.fromEntries(new URLSearchParams(await request.text()));
  return ctx;
};

describe('Token Controller - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test for missing DPoP header (explicitly checked in controller)
  it('should return invalid_dpop_proof error when DPoP header is missing', async () => {
    const request = new Request('http://localhost:3000/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // DPoP header is missing
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid_code',
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: 'some_verifier',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: 'dummy_assertion',
      }).toString(),
    }).clone();

    c = createMockContext(request);
    const handler = exchangeToken(mockTokenExchangeUseCase);

    const response = await handler(c);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('invalid_dpop_proof');
    expect(responseBody.error_description).toBe('Missing mandatory DPoP header');
  });

  // Test for invalid request due to body parsing or schema validation
  it('should return invalid_request error when request body is malformed', async () => {
    const request = new Request('http://localhost:3000/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': 'dummy-dpop-header',
      },
      body: 'grant_type=authorization_code&code=valid_code&redirect_uri=http://localhost:3000/callback&code_verifier=some_verifier&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=dummy_assertion&invalid_param=extra', // Malformed body
    }).clone();

    c = createMockContext(request);
    const handler = exchangeToken(mockTokenExchangeUseCase);

    const response = await handler(c);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('invalid_request');
    expect(responseBody.error_description).toBe('Missing or malformed parameters'); // This error message is thrown by the controller
  });

  // Test for invalid_token error when use case throws it
  it('should return invalid_token error when use case specifically throws it', async () => {
    mockTokenExchangeUseCase.execute.mockRejectedValueOnce(
      new FapiError('invalid_token', 'Invalid token signature', 400) // Simulate FapiError from use case
    );

    const request = new Request('http://localhost:3000/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': 'dummy-dpop-header',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid_code',
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: 'some_verifier',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: 'dummy_assertion',
      }).toString(),
    }).clone();

    c = createMockContext(request);
    const handler = exchangeToken(mockTokenExchangeUseCase);

    const response = await handler(c);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe('invalid_token');
    expect(responseBody.error_description).toBe('Invalid token signature');
  });

  // Test for server_error when use case throws an unexpected error
  it('should return server_error when use case execution fails with an unexpected error', async () => {
    const unexpectedError = new Error('Database connection failed');
    mockTokenExchangeUseCase.execute.mockRejectedValueOnce(unexpectedError);

    const request = new Request('http://localhost:3000/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': 'dummy-dpop-header',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'valid_code',
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: 'some_verifier',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: 'dummy_assertion',
      }).toString(),
    }).clone();

    c = createMockContext(request);
    const handler = exchangeToken(mockTokenExchangeUseCase);

    const response = await handler(c);
    const responseBody = await response.json();

    expect(response.status).toBe(500); // Controller wraps non-FapiErrors in serverError
    expect(responseBody.error).toBe('server_error');
    expect(responseBody.error_description).toBe('An unexpected error occurred during token exchange.');
  });

  // Note on temporarily_unavailable:
  // The current controller logic catches non-FapiErrors and re-throws them as 'server_error'.
  // To specifically test 'temporarily_unavailable' being thrown *by the controller*,
  // the use case would need to be mocked to throw a FapiError with 'temporarily_unavailable'.
  // The current implementation in token.service.ts already throws FapiErrors.temporarilyUnavailable,
  // which would be caught and re-thrown as 'server_error' by the controller's catch-all if not `err instanceof FapiError`.
  // The condition `if (err instanceof FapiError || err.name === 'FapiError')` handles this by re-throwing.
  // So, if useCase.execute threw FapiErrors.temporarilyUnavailable, it should pass through.
  // A dedicated test for 'temporarily_unavailable' would involve mocking useCase.execute to throw that specific FapiError.
});
