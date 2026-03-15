import { describe, it, expect, beforeEach, vi, spyOn } from 'bun:test';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { TokenExchangeUseCase } from '../../../src/core/use-cases/token-exchange';
import { exchangeToken } from '../../../src/infra/http/controllers/token.controller';
import { FapiErrors, FapiError } from '../../../src/infra/middleware/fapi-error';

// Mock dependencies and use case
const mockTokenExchangeUseCase: Mock<TokenExchangeUseCase> = {
  execute: vi.fn(),
} as Mock<TokenExchangeUseCase>;

// Mock Hono app and context
const app = new Hono();
let c: Context;

// Helper to create a mock Hono Context for middleware testing
const createMockContext = async (request: Request): Promise<Context> => {
  const mockRequest = {
    ...request,
    // Mock the header method, as it's used in the controller
    header: (key: string): string | undefined => {
      // Simulate Hono's header retrieval
      if (key === 'DPoP') {
        return request.headers.get('DPoP') || undefined;
      }
      // Add other headers if needed by the controller/middleware
      return request.headers.get(key) || undefined;
    },
    // Mock other Request properties/methods if needed by the controller
  };

  // Mock the Response object that the controller might return or modify
  const mockResponse = {
    status: 200,
    json: vi.fn().mockResolvedValue({}), // Mock json method to capture data
    headers: new Headers(),
    // Add other Response properties/methods if needed
  };

  // Construct a simplified mock Context object
  const mockContext: Context = {
    req: mockRequest as any, // Type assertion
    res: mockResponse as any, // Type assertion
    env: {}, // Mock environment
    executionCtx: {}, // Mock execution context
    // Other Hono Context properties could be added if required by the middleware.
    // For now, focusing on req and res which are commonly used.
  } as Context;

  // Mock parseBody if the controller or middleware relies on it for form data parsing.
  // The exchangeToken controller uses request.text() and URLSearchParams, so this might not be strictly necessary
  // if the test manually provides the request body. However, to be safe, let's mock it.
  (mockRequest as any).parseBody = async () => {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text));
  };

  return mockContext;
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

    c = await createMockContext(request);
    const handler = exchangeToken(mockTokenExchangeUseCase);

    try {
      await handler(c);
      throw new Error('Expected FapiError but got none');
    } catch (e) {
      if (e instanceof FapiError) {
        expect(e?.status).toBe(400);
        expect(e?.error).toBe('invalid_dpop_proof');
        expect(e?.description).toBe('Missing mandatory DPoP header');
      } else {
        throw e;
      }
    }
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

    c = await createMockContext(request);
    spyOn(mockTokenExchangeUseCase, "execute").mockRejectedValueOnce(FapiErrors.invalidRequest('Missing or malformed parameters'));
    const handler = exchangeToken(mockTokenExchangeUseCase);

    try {
      await handler(c);
      throw new Error("Expected FapiError but got none");
    } catch (e) {
      if (e instanceof FapiError) {
        expect(e?.status).toBe(400);
        expect(e?.error).toBe('invalid_request');
        expect(e?.description).toBe('Missing or malformed parameters');
      } else {
        throw e;
      }
    }
  });

  // Test for invalid_token error when use case throws it
  it('should return invalid_token error when use case specifically throws it', async () => { 
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

    c = await createMockContext(request);
    spyOn(mockTokenExchangeUseCase, "execute").mockRejectedValueOnce(FapiErrors.invalidToken('Invalid token signature'));
    const handler = exchangeToken(mockTokenExchangeUseCase);

    try {
      await handler(c);
      throw new Error("Expected FapiError but got none");
    } catch(e) {
      if (e instanceof FapiError) {
        expect(e.status).toBe(400);
        expect(e.error).toBe('invalid_token');
        expect(e.description).toBe('Invalid token signature');
      } else {
        throw e;
      }
    }
  });

  // Test for server_error when use case throws an unexpected error
  it('should return server_error when use case execution fails with an unexpected error', async () => {
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

    c = await createMockContext(request);
    spyOn(mockTokenExchangeUseCase, "execute").mockRejectedValueOnce(new Error('Database connection failed'));
    const handler = exchangeToken(mockTokenExchangeUseCase);

    try {
      await handler(c);
      throw new Error("Expected FapiError but got none");
    } catch (e) {
      if (e instanceof FapiError) {
        expect(e.status).toBe(500); // Controller wraps non-FapiErrors in serverError
        expect(e.error).toBe('server_error');
        expect(e.description).toBe('An unexpected error occurred during token exchange.');
      } else {
        throw e;
      }
    }
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
